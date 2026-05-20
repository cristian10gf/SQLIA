import { Inject, Injectable } from '@nestjs/common';
import { CHALLENGE_SANDBOX_REPOSITORY } from '../../domain/repositories/challenge-sandbox.repository.interface';
import type {
  IChallengeSandboxRepository,
  ChallengeSandboxRecord,
} from '../../domain/repositories/challenge-sandbox.repository.interface';

@Injectable()
export class GetChallengeSandboxUseCase {
  constructor(
    @Inject(CHALLENGE_SANDBOX_REPOSITORY)
    private readonly sandboxes: IChallengeSandboxRepository,
  ) {}

  async execute(challengeId: string): Promise<ChallengeSandboxRecord | null> {
    return this.sandboxes.findByChallengeId(challengeId);
  }
}
