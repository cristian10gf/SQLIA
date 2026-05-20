import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IChallengeSandboxExpiresAtQuery } from '../../domain/interfaces/challenge-sandbox-expires-at.query.interface';

@Injectable()
export class PrismaChallengeSandboxExpiresAtQuery implements IChallengeSandboxExpiresAtQuery {
  constructor(private readonly prisma: PrismaService) {}

  async resolveExpiresAt(challengeId: string): Promise<Date> {
    const agg = await this.prisma.evaluation.aggregate({
      where: {
        challenges: { some: { challengeId } },
      },
      _max: { endDate: true },
    });
    if (agg._max.endDate) {
      return agg._max.endDate;
    }
    const days = parseInt(
      process.env.SANDBOX_TTL_DAYS ?? process.env.SANDBOX_DEFAULT_TTL_DAYS ?? '30',
      10,
    );
    const ttlMs = (Number.isFinite(days) && days > 0 ? days : 30) * 86_400_000;
    return new Date(Date.now() + ttlMs);
  }
}
