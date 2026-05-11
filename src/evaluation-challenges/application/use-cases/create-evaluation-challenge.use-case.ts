import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { EVALUATION_CHALLENGE_REPOSITORY } from '../../domain/repositories/evaluation-challenge.repository.interface';
import type { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';
import { EvaluationChallenge } from '../../domain/entities/evaluation-challenge.entity';
import { CreateEvaluationChallengeDto } from '../dtos/create-evaluation-challenge.dto';

@Injectable()
export class CreateEvaluationChallengeUseCase {
  constructor(
    @Inject(EVALUATION_CHALLENGE_REPOSITORY)
    private readonly evaluationChallengeRepository: IEvaluationChallengeRepository,
  ) {}

  async execute(dto: CreateEvaluationChallengeDto): Promise<EvaluationChallenge> {
    const existing = await this.evaluationChallengeRepository.findByEvaluationAndChallenge(
      dto.evaluationId,
      dto.challengeId,
    );

    if (existing) {
      throw new ConflictException('Este reto ya esta asociado a esta evaluacion');
    }

    const evaluationChallenge = new EvaluationChallenge(
      dto.evaluationId,
      dto.challengeId,
      dto.orderIndex ?? null,
      dto.points ?? 10,
    );

    return await this.evaluationChallengeRepository.save(evaluationChallenge);
  }
}
