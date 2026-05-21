import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../auth/domain/enums/role.enum';
import { EnrollmentForbiddenError } from '../../domain/errors/enrollment-forbidden.error';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindCoursesByStudentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(
    studentId: string,
    requesterUserId: string,
    requesterRole: string,
    pagination?: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    if (requesterRole === Role.ADMIN) {
      return await this.enrollmentRepository.findCoursesByStudent(
        studentId,
        skip,
        limit,
      );
    }

    if (requesterRole === Role.STUDENT) {
      if (requesterUserId !== studentId) {
        throw new EnrollmentForbiddenError(
          'Solo podés consultar los cursos de tu propia cuenta',
        );
      }
      return await this.enrollmentRepository.findCoursesByStudent(
        studentId,
        skip,
        limit,
      );
    }

    if (requesterRole === Role.PROFESSOR) {
      return await this.enrollmentRepository.findCoursesByStudentAndProfessor(
        studentId,
        requesterUserId,
        skip,
        limit,
      );
    }

    throw new EnrollmentForbiddenError('No tenés permiso para ver estos cursos');
  }
}
