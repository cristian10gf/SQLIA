import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentAlreadyExistsError } from '../../domain/errors/enrollment-already-exists.error';
import { EnrollmentNotFoundError } from '../../domain/errors/enrollment-not-found.error';
import { EnrollmentForbiddenError } from '../../domain/errors/enrollment-forbidden.error';
import { EnrollmentCourseNotFoundError } from '../../domain/errors/enrollment-course-not-found.error';
import { InvalidEnrollmentCsvError } from '../../domain/errors/invalid-enrollment-csv.error';

export function mapEnrollmentDomainErrorToHttp(error: unknown): never {
  if (error instanceof EnrollmentAlreadyExistsError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof EnrollmentNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof EnrollmentCourseNotFoundError) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof EnrollmentForbiddenError) {
    throw new ForbiddenException(error.message);
  }
  if (error instanceof InvalidEnrollmentCsvError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
