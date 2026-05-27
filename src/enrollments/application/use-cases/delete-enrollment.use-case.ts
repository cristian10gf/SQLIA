import { Injectable, Inject } from '@nestjs/common';
import { EnrollmentNotFoundError } from '../../domain/errors/enrollment-not-found.error';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';

@Injectable()
export class DeleteEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(studentId: string, courseId: string): Promise<void> {
    const existing = await this.enrollmentRepository.findByCompositeId(
      studentId,
      courseId,
    );
    if (!existing) {
      throw new EnrollmentNotFoundError();
    }
    await this.enrollmentRepository.deleteByCompositeId(studentId, courseId);
  }
}
