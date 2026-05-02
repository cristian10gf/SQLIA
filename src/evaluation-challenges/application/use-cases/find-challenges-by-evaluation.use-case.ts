import { Inject, Injectable } from '@nestjs/common';
import { EVALUATION_CHALLENGE_REPOSITORY } from '../../domain/repositories/evaluation-challenge.repository.interface';
import type { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';
import { ListChallengesQueryDto } from '../dtos/list-challenges-query.dto';

@Injectable()
export class FindChallengesByEvaluationUseCase {
  constructor(
    @Inject(EVALUATION_CHALLENGE_REPOSITORY)
    private readonly evaluationChallengeRepository: IEvaluationChallengeRepository,
  ) {}

  async execute(evaluationId: string, query?: ListChallengesQueryDto) {
    const { page = 1, limit = 10, visibility = 'all' } = query || {};
    const skip = (page - 1) * limit;

    const visibilityFilter =
      visibility === 'visible' ? true : visibility === 'invisible' ? false : undefined;

    return await this.evaluationChallengeRepository.findByEvaluation(
      evaluationId,
      skip,
      limit,
      visibilityFilter,
    );
  }
}
