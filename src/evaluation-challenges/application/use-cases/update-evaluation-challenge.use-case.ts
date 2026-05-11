import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_CHALLENGE_REPOSITORY } from '../../domain/repositories/evaluation-challenge.repository.interface';
import type { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';
import { EvaluationChallenge } from '../../domain/entities/evaluation-challenge.entity';
import { UpdateEvaluationChallengeDto } from '../dtos/update-evaluation-challenge.dto';

@Injectable()
export class UpdateEvaluationChallengeUseCase {
  constructor(
    @Inject(EVALUATION_CHALLENGE_REPOSITORY)
    private readonly evaluationChallengeRepository: IEvaluationChallengeRepository,
  ) {}

  async execute(
    evaluationId: string,
    challengeId: string,
    dto: UpdateEvaluationChallengeDto,
  ): Promise<EvaluationChallenge> {
    const existing = await this.evaluationChallengeRepository.findByEvaluationAndChallenge(
      evaluationId,
      challengeId,
    );

    if (!existing) {
      throw new NotFoundException('La asociacin entre reto y evaluacion no existe');
    }

    const data: Partial<EvaluationChallenge> = {
      orderIndex: dto.orderIndex,
      points: dto.points,
    };

    return await this.evaluationChallengeRepository.update(evaluationId, challengeId, data);
  }
}
