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

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController],
  providers: [
    CreateEnrollmentUseCase,
    DeleteEnrollmentUseCase,
    FindStudentsByCourseUseCase,
    FindCoursesByStudentUseCase,
    FindCoursesByProfessorUseCase,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
  ],
})
export class EnrollmentsModule {}