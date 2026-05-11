import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_CHALLENGE_REPOSITORY } from '../../domain/repositories/evaluation-challenge.repository.interface';
import type { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';

@Injectable()
export class DeleteEvaluationChallengeUseCase {
  constructor(
    @Inject(EVALUATION_CHALLENGE_REPOSITORY)
    private readonly evaluationChallengeRepository: IEvaluationChallengeRepository,
  ) {}

  async execute(evaluationId: string, challengeId: string): Promise<void> {
    const existing = await this.evaluationChallengeRepository.findByEvaluationAndChallenge(
      evaluationId,
      challengeId,
    );

    if (!existing) {
      throw new NotFoundException('La asociacion entre reto y evaluacion no existe');
    }

    await this.evaluationChallengeRepository.delete(evaluationId, challengeId);
  }
}
