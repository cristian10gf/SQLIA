import { Module } from '@nestjs/common';
import { EnrollmentController } from './infrastructure/controllers/enrollment.controller';
import { CreateEnrollmentUseCase } from './application/use-cases/create-enrollment.use-case';
import { PrismaEnrollmentRepository } from './infrastructure/persistence/prisma-enrollment.repository';
import { ENROLLMENT_REPOSITORY } from './domain/repositories/enrollment.repository.interface';
import { PrismaModule } from '../prisma/prisma.module';
import { DeleteEnrollmentUseCase } from './application/use-cases/delete-enrollment.use-case';
import { FindStudentsByCourseUseCase } from './application/use-cases/find-students-by-course.use-case';
import { FindCoursesByStudentUseCase } from './application/use-cases/find-courses-by-student.use-case';
import { FindCoursesByProfessorUseCase } from './application/use-cases/find-courses-by-professor.use-case';
import { BulkEnrollFromCsvUseCase } from './application/use-cases/bulk-enroll-from-csv.use-case';
import {
  COURSE_PROFESSOR_QUERY,
  ENROLLMENT_CSV_PARSER,
  STUDENT_EMAIL_LOOKUP_QUERY,
} from './domain/interfaces/enrollment-bulk.tokens';
import { PrismaCourseProfessorQuery } from './infrastructure/persistence/prisma-course-professor.query';
import { PrismaStudentEmailLookupQuery } from './infrastructure/persistence/prisma-student-email-lookup.query';
import { BrightspaceEnrollmentCsvParser } from './infrastructure/services/brightspace-enrollment-csv.parser';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController],
  providers: [
    CreateEnrollmentUseCase,
    DeleteEnrollmentUseCase,
    FindStudentsByCourseUseCase,
    FindCoursesByStudentUseCase,
    FindCoursesByProfessorUseCase,
    BulkEnrollFromCsvUseCase,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
    {
      provide: COURSE_PROFESSOR_QUERY,
      useClass: PrismaCourseProfessorQuery,
    },
    {
      provide: STUDENT_EMAIL_LOOKUP_QUERY,
      useClass: PrismaStudentEmailLookupQuery,
    },
    {
      provide: ENROLLMENT_CSV_PARSER,
      useClass: BrightspaceEnrollmentCsvParser,
    },
  ],
})
export class EnrollmentsModule {}