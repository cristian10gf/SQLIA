import { Inject, Injectable } from '@nestjs/common';
import { EVALUATION_CHALLENGE_REPOSITORY } from '../../domain/repositories/evaluation-challenge.repository.interface';
import type { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindVisibleChallengesByEvaluationUseCase {
  constructor(
    @Inject(EVALUATION_CHALLENGE_REPOSITORY)
    private readonly evaluationChallengeRepository: IEvaluationChallengeRepository,
  ) {}

  async execute(evaluationId: string, pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    return await this.evaluationChallengeRepository.findByEvaluation(evaluationId, skip, limit, true);
  }
}
