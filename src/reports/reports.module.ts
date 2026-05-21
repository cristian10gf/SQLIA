import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsController } from './infrastructure/controllers/reports.controller';
import { FindStudentEvaluationScoresUseCase } from './application/use-cases/find-student-evaluation-scores.use-case';
import { FindStudentSubmissionSummaryUseCase } from './application/use-cases/find-student-submission-summary.use-case';
import { REPORT_REPOSITORY } from './domain/repositories/report.repository.interface';
import { PrismaReportRepository } from './infrastructure/persistence/prisma-report.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [
    FindStudentEvaluationScoresUseCase,
    FindStudentSubmissionSummaryUseCase,
    {
      provide: REPORT_REPOSITORY,
      useClass: PrismaReportRepository,
    },
  ],
})
export class ReportsModule {}