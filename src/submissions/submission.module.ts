import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { SubmissionsController } from './infrastructure/controllers/submissions.controller';
import { SqlWorker } from './infrastructure/queue/sql.worker';
import { PrismaSubmissionRepository } from './infrastructure/persistence/prisma-submission.repository';
import { PrismaSubmissionEligibilityQuery } from './infrastructure/persistence/prisma-submission-eligibility.query';
import { SqlEvaluationService } from './infrastructure/services/sql-evaluation.service';
import { SubmissionStalledRecoveryService } from './infrastructure/services/submission-stalled-recovery.service';
import { CreateSubmissionUseCase } from './application/use-cases/create-submission.use-case';
import { GetSubmissionByIdUseCase } from './application/use-cases/get-submission-by-id.use-case';
import { SUBMISSION_REPOSITORY } from './domain/repositories/submission.repository.interface';
import { SUBMISSION_ELIGIBILITY_QUERY } from './domain/interfaces/submission-eligibility.query.tokens';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    ChallengesModule,
    BullModule.registerQueue({
      name: 'sql-evaluation',
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: 'exponential', delay: 4000 },
      },
    }),
  ],
  controllers: [SubmissionsController],
  providers: [
    SqlWorker,
    SqlEvaluationService,
    SubmissionStalledRecoveryService,
    CreateSubmissionUseCase,
    GetSubmissionByIdUseCase,
    {
      provide: SUBMISSION_REPOSITORY,
      useClass: PrismaSubmissionRepository,
    },
    {
      provide: SUBMISSION_ELIGIBILITY_QUERY,
      useClass: PrismaSubmissionEligibilityQuery,
    },
  ],
})
export class SubmissionsModule {}
