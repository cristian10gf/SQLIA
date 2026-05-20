import { Injectable } from '@nestjs/common';
import { ChallengeSandboxStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ChallengeSandboxRecord,
  IChallengeSandboxRepository,
} from '../../domain/repositories/challenge-sandbox.repository.interface';
import { ChallengeSandboxMapper } from '../mappers/challenge-sandbox.mapper';

@Injectable()
export class PrismaChallengeSandboxRepository implements IChallengeSandboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChallengeId(challengeId: string): Promise<ChallengeSandboxRecord | null> {
    const row = await this.prisma.challengeSandbox.findUnique({
      where: { challengeId },
    });
    return row ? ChallengeSandboxMapper.toRecord(row) : null;
  }

  async findOrCreatePending(challengeId: string): Promise<ChallengeSandboxRecord> {
    const existing = await this.prisma.challengeSandbox.findUnique({
      where: { challengeId },
    });
    if (existing) {
      return ChallengeSandboxMapper.toRecord(existing);
    }
    const row = await this.prisma.challengeSandbox.create({
      data: {
        challengeId,
        status: ChallengeSandboxStatus.PENDING,
      },
    });
    return ChallengeSandboxMapper.toRecord(row);
  }

  async updateByChallengeId(
    challengeId: string,
    data: Partial<
      Pick<
        ChallengeSandboxRecord,
        | 'status'
        | 'dockerContainerName'
        | 'hostPort'
        | 'dbUser'
        | 'dbPassword'
        | 'dbName'
        | 'connectionHost'
        | 'expiresAt'
        | 'lastError'
      >
    >,
  ): Promise<ChallengeSandboxRecord> {
    const row = await this.prisma.challengeSandbox.update({
      where: { challengeId },
      data: {
        ...(data.status ? { status: data.status as ChallengeSandboxStatus } : {}),
        ...(data.dockerContainerName !== undefined
          ? { dockerContainerName: data.dockerContainerName }
          : {}),
        ...(data.hostPort !== undefined ? { hostPort: data.hostPort } : {}),
        ...(data.dbUser !== undefined ? { dbUser: data.dbUser } : {}),
        ...(data.dbPassword !== undefined ? { dbPassword: data.dbPassword } : {}),
        ...(data.dbName !== undefined ? { dbName: data.dbName } : {}),
        ...(data.connectionHost !== undefined ? { connectionHost: data.connectionHost } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
      },
    });
    return ChallengeSandboxMapper.toRecord(row);
  }

  async findChallengeIdsProvisioningOlderThan(before: Date): Promise<string[]> {
    const rows = await this.prisma.challengeSandbox.findMany({
      where: {
        status: ChallengeSandboxStatus.PROVISIONING,
        updatedAt: { lt: before },
      },
      select: { challengeId: true },
    });
    return rows.map((r) => r.challengeId);
  }

  async findChallengeIdsReadyExpired(asOf: Date): Promise<string[]> {
    const rows = await this.prisma.challengeSandbox.findMany({
      where: {
        status: ChallengeSandboxStatus.READY,
        expiresAt: { lte: asOf },
      },
      select: { challengeId: true },
    });
    return rows.map((r) => r.challengeId);
  }
}
