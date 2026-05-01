import { Injectable, Inject } from '@nestjs/common';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindCoursesByProfessorUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(professorId: string, pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    return await this.enrollmentRepository.findCoursesByProfessor(professorId, skip, limit);
  }
}
