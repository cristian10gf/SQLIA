import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SqlConnectionParams } from '../../../shared/domain/interfaces/sql-execution.interface';
import { buildSubmissionTests } from '../../domain/evaluation/build-submission-tests';
import { mapPgExecutionError } from '../../domain/evaluation/map-pg-execution-error';
import type { SubmissionStatusValue } from '../../domain/entities/submission.entity';
import { SUBMISSION_EVALUATION_CONTEXT_QUERY } from '../../domain/interfaces/submission-evaluation-context.query.tokens';
import type { ISubmissionEvaluationContextQuery } from '../../domain/interfaces/submission-evaluation-context.query.interface';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface';
import { computeSubmissionScore } from '../../domain/scoring/submission-scoring';
import { SQL_SANDBOX_RUNNER } from '../../domain/interfaces/sql-sandbox-runner.interface';
import type { ISqlSandboxRunner } from '../../domain/interfaces/sql-sandbox-runner.interface';
import { AnalyzeSqlUseCase } from '../../../ai/application/use-cases/analyze-sql.use-case';

@Injectable()
export class EvaluateSubmissionUseCase {
  private readonly logger = new Logger(EvaluateSubmissionUseCase.name);

  constructor(
    @Inject(SUBMISSION_EVALUATION_CONTEXT_QUERY)
    private readonly evaluationContext: ISubmissionEvaluationContextQuery,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
    @Inject(SQL_SANDBOX_RUNNER)
    private readonly sandboxRunner: ISqlSandboxRunner,
    private readonly analyzeSql: AnalyzeSqlUseCase,
  ) {}

  async execute(submissionId: string): Promise<void> {
    const submission =
      await this.evaluationContext.findSubmissionForEvaluation(submissionId);
    if (!submission) {
      this.logger.warn(`Submission no encontrada ${submissionId}`);
      return;
    }

    const sandbox = await this.evaluationContext.findSandboxConnection(
      submission.challengeId,
    );
    if (!sandbox) {
      await this.submissions.updateResult(submissionId, {
        status: 'RUNTIME_ERROR',
        score: 0,
        executionTimeMs: 0,
        resultJson: {
          status: 'RUNTIME_ERROR',
          score: 0,
          message: 'Sandbox del reto no disponible.',
          tests: [],
          scoring: null,
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

    const connection: SqlConnectionParams = {
      host: sandbox.host,
      port: sandbox.port,
      user: sandbox.user,
      password: sandbox.password,
      database: sandbox.database,
    };
    const schemaName = `sub_${submissionId.replace(/-/g, '_')}`;
    const timeLimitMs = submission.challenge.timeLimitMs ?? 2000;

    const execResult = await this.sandboxRunner.executeInIsolatedSchema({
      connection,
      schemaName,
      schemaDefinition: submission.challenge.schemaDefinition,
      seedScript: submission.challenge.seedScript,
      query: submission.query,
      timeLimitMs,
    });

    let executionTimeMs = 0;
    let rows: unknown[] = [];
    let errorStatus: SubmissionStatusValue | undefined;
    let errorMessage: string | undefined;

    try {
      if (execResult.ok) {
        rows = execResult.rows;
        executionTimeMs = execResult.durationMs;
      } else {
        errorStatus = mapPgExecutionError(execResult.error);
        errorMessage =
          execResult.error instanceof Error
            ? execResult.error.message
            : String(execResult.error);
      }
    } finally {
      await this.sandboxRunner
        .dropSchema(connection, schemaName)
        .catch((dropErr) => {
          this.logger.warn(`DROP SCHEMA ${schemaName}: ${dropErr}`);
        });
    }

    const tests = errorStatus
      ? []
      : buildSubmissionTests(submission.challenge.expectedResult, rows);

    const scored = computeSubmissionScore({
      tests,
      executionTimeMs,
      timeLimitMs,
      query: submission.query,
      errorStatus,
    });

    const resultJson: Record<string, unknown> = {
      status: scored.status,
      score: scored.score,
      executionTimeMs,
      engine: submission.challenge.databaseEngine,
      tests,
      scoring: scored.breakdown,
    };
    if (errorMessage) {
      resultJson.error = errorMessage;
    }

    let aiRecommendations: string | undefined;
    try {
      const aiResults = errorStatus
        ? JSON.stringify({ error: errorMessage, status: errorStatus })
        : JSON.stringify(rows);
      aiRecommendations = await this.analyzeSql.execute({
        query: submission.query,
        expected: JSON.stringify(submission.challenge.expectedResult),
        results: aiResults,
      });
    } catch (aiErr) {
      this.logger.warn(`AI analysis skipped: ${aiErr}`);
    }
    if (aiRecommendations) {
      resultJson.aiRecommendations = aiRecommendations;
    }

    await this.submissions.updateResult(submissionId, {
      status: scored.status,
      score: scored.score,
      executionTimeMs,
      resultJson: resultJson as Record<string, any>,
    });
  }
}
