import { Module } from '@nestjs/common';
import { EnrollmentController } from './infrastructure/controllers/enrollment.controller';
import { CreateEnrollmentUseCase } from './application/use-cases/create-enrollment.use-case';
import { PrismaEnrollmentRepository } from './infrastructure/persistence/prisma-enrollment.repository';
import { ENROLLMENT_REPOSITORY } from './domain/repositories/enrollment.repository.interface';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController],
  providers: [
    CreateEnrollmentUseCase,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
  ],
})
export class EnrollmentsModule {}