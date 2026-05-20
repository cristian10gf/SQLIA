import type { ChallengeSandbox as PrismaChallengeSandbox } from '@prisma/client';
import type {
  ChallengeSandboxRecord,
  ChallengeSandboxStatusValue,
} from '../../domain/repositories/challenge-sandbox.repository.interface';

export class ChallengeSandboxMapper {
  static toRecord(row: PrismaChallengeSandbox): ChallengeSandboxRecord {
    return {
      id: row.id,
      challengeId: row.challengeId,
      status: row.status as ChallengeSandboxStatusValue,
      dockerContainerName: row.dockerContainerName,
      hostPort: row.hostPort,
      dbUser: row.dbUser,
      dbPassword: row.dbPassword,
      dbName: row.dbName,
      connectionHost: row.connectionHost,
      expiresAt: row.expiresAt,
      lastError: row.lastError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
