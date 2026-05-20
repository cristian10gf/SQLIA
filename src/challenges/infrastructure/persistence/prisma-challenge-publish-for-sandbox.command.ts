import { Injectable } from '@nestjs/common';
import { ChallengeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IChallengePublishForSandboxCommand } from '../../domain/interfaces/challenge-publish-for-sandbox.command.interface';

@Injectable()
export class PrismaChallengePublishForSandboxCommand implements IChallengePublishForSandboxCommand {
  constructor(private readonly prisma: PrismaService) {}

  async publishChallengeForSandboxProvision(challengeId: string): Promise<void> {
    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: ChallengeStatus.PUBLISHED },
    });
  }
}
