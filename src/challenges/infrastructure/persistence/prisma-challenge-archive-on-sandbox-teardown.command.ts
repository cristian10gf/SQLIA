import { Injectable } from '@nestjs/common';
import { ChallengeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IChallengeArchiveOnSandboxTeardownCommand } from '../../domain/interfaces/challenge-archive-on-sandbox-teardown.command.interface';

@Injectable()
export class PrismaChallengeArchiveOnSandboxTeardownCommand implements IChallengeArchiveOnSandboxTeardownCommand {
  constructor(private readonly prisma: PrismaService) {}

  async archiveChallengeOnSandboxTeardown(challengeId: string): Promise<void> {
    await this.prisma.challenge.updateMany({
      where: { id: challengeId, status: ChallengeStatus.PUBLISHED },
      data: { status: ChallengeStatus.ARCHIVED },
    });
  }
}
