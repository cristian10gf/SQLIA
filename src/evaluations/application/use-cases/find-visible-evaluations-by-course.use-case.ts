import { Inject, Injectable } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindVisibleEvaluationsByCourseUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(courseId: string, pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    return await this.evaluationRepository.findByCourse(courseId, skip, limit, true);
  }
}