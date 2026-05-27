import { Injectable, Inject } from '@nestjs/common';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import { EnrollmentAlreadyExistsError } from '../../domain/errors/enrollment-already-exists.error';
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';

@Injectable()
export class CreateEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const existing = await this.enrollmentRepository.findByCompositeId(
      dto.studentId,
      dto.courseId,
    );
    if (existing) {
      throw new EnrollmentAlreadyExistsError();
    }
    const enrollment = new Enrollment(
      dto.studentId,
      dto.courseId,
      new Date(),
    );
    return await this.enrollmentRepository.save(enrollment);
  }
}
