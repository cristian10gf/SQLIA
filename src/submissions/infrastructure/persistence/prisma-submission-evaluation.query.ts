import { Injectable } from '@nestjs/common';
import { ChallengeSandboxStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ISubmissionEvaluationContextQuery,
  SandboxConnectionForEvaluation,
  SubmissionForEvaluationRow,
} from '../../domain/interfaces/submission-evaluation-context.query.interface';

@Injectable()
export class PrismaSubmissionEvaluationContextQuery
  implements ISubmissionEvaluationContextQuery
{
  constructor(private readonly prisma: PrismaService) {}

  async findSubmissionForEvaluation(
    submissionId: string,
  ): Promise<SubmissionForEvaluationRow | null> {
    const row = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        challengeId: true,
        query: true,
        challenge: {
          select: {
            schemaDefinition: true,
            seedScript: true,
            expectedResult: true,
            timeLimitMs: true,
            databaseEngine: true,
          },
        },
      },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      challengeId: row.challengeId,
      query: row.query,
      challenge: {
        schemaDefinition: row.challenge.schemaDefinition,
        seedScript: row.challenge.seedScript,
        expectedResult: row.challenge.expectedResult,
        timeLimitMs: row.challenge.timeLimitMs,
        databaseEngine: row.challenge.databaseEngine,
      },
    };
  }

  async findSandboxConnection(
    challengeId: string,
  ): Promise<SandboxConnectionForEvaluation | null> {
    const sandbox = await this.prisma.challengeSandbox.findUnique({
      where: { challengeId },
    });
    if (
      !sandbox ||
      sandbox.status !== ChallengeSandboxStatus.READY ||
      !sandbox.hostPort ||
      !sandbox.dbPassword ||
      !sandbox.dbName
    ) {
      return null;
    }

    return {
      status: sandbox.status,
      host: sandbox.connectionHost || process.env.SQL_SANDBOX_DB_HOST || '127.0.0.1',
      port: sandbox.hostPort,
      user: sandbox.dbUser || 'postgres',
      password: sandbox.dbPassword,
      database: sandbox.dbName,
    };
  }
}
