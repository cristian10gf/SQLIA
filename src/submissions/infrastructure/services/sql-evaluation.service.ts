import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChallengeSandboxStatus, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SQL_EXECUTION_PORT } from '../../../shared/domain/interfaces/sql-execution.tokens';
import type {
  ISqlExecutionPort,
  SqlConnectionParams,
} from '../../../shared/domain/interfaces/sql-execution.interface';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface';
import type { SubmissionStatusValue } from '../../domain/entities/submission.entity';

interface ExpectedCase {
  caseId?: number;
  expectedRows?: number;
  expectedPayload?: unknown;
}

interface ExpectedResultShape {
  cases?: ExpectedCase[];
}

function stableSerialize(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(norm);
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) {
      out[k] = norm(o[k]);
    }
    return out;
  };
  return JSON.stringify(norm(value));
}

/**
 * Evalúa submissions en el contenedor `READY` del reto usando un schema aislado `sub_<submissionId>`.
 *
 * Convención de `challenge.expectedResult` (JSON opcional):
 * `{ "cases": [ { "caseId": 1, "expectedRows": 5, "expectedPayload": null } ] }`.
 * Sin `cases`, se compara todo el resultado (serialización estable ordenada).
 */
@Injectable()
export class SqlEvaluationService {
  private readonly logger = new Logger(SqlEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SQL_EXECUTION_PORT) private readonly sql: ISqlExecutionPort,
    @Inject(SUBMISSION_REPOSITORY) private readonly submissions: ISubmissionRepository,
  ) {}

  async evaluateSubmission(submissionId: string): Promise<void> {
    const row = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { challenge: true },
    });
    if (!row) {
      this.logger.warn(`Submission no encontrada ${submissionId}`);
      return;
    }

    const sandbox = await this.prisma.challengeSandbox.findUnique({
      where: { challengeId: row.challengeId },
    });

    if (
      !sandbox ||
      sandbox.status !== ChallengeSandboxStatus.READY ||
      !sandbox.hostPort ||
      !sandbox.dbPassword ||
      !sandbox.dbName
    ) {
      await this.prisma.submission.updateMany({
        where: { id: submissionId, status: SubmissionStatus.QUEUED },
        data: {
          status: SubmissionStatus.RUNTIME_ERROR,
          score: 0,
          executionTimeMs: 0,
          resultJson: {
            status: 'RUNTIME_ERROR',
            message: 'Sandbox del reto no disponible.',
            tests: [],
          },
        },
      });
      this.logger.warn(`Sandbox no READY para submission ${submissionId}`);
      return;
    }

    const claimed = await this.submissions.claimForProcessing(submissionId);
    if (!claimed) {
      this.logger.log(`Submission ${submissionId} ya no estaba QUEUED; idempotencia.`);
      return;
    }

    const host = sandbox.connectionHost || process.env.SQL_SANDBOX_DB_HOST || '127.0.0.1';
    const params: SqlConnectionParams = {
      host,
      port: sandbox.hostPort,
      user: sandbox.dbUser || 'postgres',
      password: sandbox.dbPassword,
      database: sandbox.dbName,
    };

    const schemaName = `sub_${submissionId.replace(/-/g, '_')}`;
    const timeLimitMs = row.challenge.timeLimitMs ?? 2000;
    const optRatio = parseFloat(process.env.OPTIMIZATION_TIME_RATIO || '0.85');

    let executionTimeMs = 0;
    let rows: unknown[] = [];
    let finalStatus: SubmissionStatusValue = 'RUNTIME_ERROR';
    let score = 0;
    let resultJson: Record<string, unknown> = {};

    try {
      await this.sql.createSubmissionSchema(
        params,
        schemaName,
        row.challenge.schemaDefinition,
        row.challenge.seedScript,
      );

      const exec = await this.sql.executeInSandbox(params, row.query, {
        statementTimeoutMs: timeLimitMs,
        searchPathSchema: schemaName,
      });
      rows = exec.rows;
      executionTimeMs = exec.durationMs;

      const tests = this.buildTests(row.challenge.expectedResult, rows);
      const allPassed = tests.every((t) => t.passed);

      if (allPassed) {
        if (executionTimeMs > timeLimitMs * optRatio) {
          finalStatus = 'OPTIMIZATION_REQUIRED';
          score = 85;
        } else {
          finalStatus = 'ACCEPTED';
          score = 100;
        }
      } else {
        finalStatus = 'WRONG_ANSWER';
        score = 0;
      }

      resultJson = { status: finalStatus, score, executionTimeMs, tests };
    } catch (err) {
      const mapped = this.mapPgError(err);
      finalStatus = mapped.status;
      score = 0;
      executionTimeMs = 0;
      resultJson = {
        status: finalStatus,
        score,
        executionTimeMs,
        tests: [],
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      await this.sql
        .dropSubmissionSchema(params, schemaName)
        .catch((dropErr) => {
          this.logger.warn(`DROP SCHEMA ${schemaName}: ${dropErr}`);
        });
    }

    await this.submissions.updateResult(submissionId, {
      status: finalStatus,
      score,
      executionTimeMs,
      resultJson: resultJson as Record<string, any>,
    });
  }

  private buildTests(
    expectedResult: unknown,
    rows: unknown[],
  ): { caseId: number; passed: boolean; detail?: string }[] {
    const tests: { caseId: number; passed: boolean; detail?: string }[] = [];
    const shape = expectedResult as ExpectedResultShape | null;

    if (shape && Array.isArray(shape.cases) && shape.cases.length > 0) {
      let idx = 0;
      for (const c of shape.cases) {
        idx += 1;
        const caseId = c.caseId ?? idx;
        let passed = true;
        let detail: string | undefined;
        if (
          typeof c.expectedRows === 'number' &&
          c.expectedRows !== rows.length
        ) {
          passed = false;
          detail = `Se esperaban ${c.expectedRows} filas, hay ${rows.length}`;
        }
        if (
          passed &&
          c.expectedPayload !== undefined &&
          c.expectedPayload !== null
        ) {
          if (stableSerialize(rows) !== stableSerialize(c.expectedPayload)) {
            passed = false;
            detail = 'expectedPayload no coincide con el resultado';
          }
        }
        tests.push({ caseId, passed, detail });
      }
      return tests;
    }

    const legacyOk = stableSerialize(rows) === stableSerialize(expectedResult);
    tests.push({
      caseId: 1,
      passed: legacyOk,
      detail: legacyOk ? undefined : 'Resultado distinto al esperado',
    });
    return tests;
  }

  private mapPgError(err: unknown): { status: SubmissionStatusValue } {
    const any = err as { code?: string; message?: string };
    const code = any.code ? String(any.code) : '';
    const msg = (any.message || '').toLowerCase();
    if (code === '57014' || msg.includes('statement timeout') || msg.includes('canceling statement')) {
      return { status: 'TIME_LIMIT_EXCEEDED' };
    }
    if (code.startsWith('42')) {
      return { status: 'SYNTAX_ERROR' };
    }
    return { status: 'RUNTIME_ERROR' };
  }
}
