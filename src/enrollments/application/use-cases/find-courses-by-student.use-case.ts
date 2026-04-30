import { Injectable, Inject } from '@nestjs/common';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindCoursesByStudentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(studentId: string, pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;
    return await this.enrollmentRepository.findCoursesByStudent(studentId, skip, limit);
  }
}
