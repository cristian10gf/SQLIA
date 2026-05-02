import { Inject, Injectable } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { ListEvaluationsQueryDto } from '../dtos/list-evaluations-query.dto';

@Injectable()
export class FindEvaluationsByCourseUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(courseId: string, query?: ListEvaluationsQueryDto) {
    const { page = 1, limit = 10, visibility = 'all' } = query || {};
    const skip = (page - 1) * limit;

    const visibilityFilter =
      visibility === 'visible' ? true : visibility === 'invisible' ? false : undefined;

    return await this.evaluationRepository.findByCourse(courseId, skip, limit, visibilityFilter);
  }
}