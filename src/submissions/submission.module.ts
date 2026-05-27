import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { AiModule } from '../ai/ai.module';
import { SubmissionsController } from './infrastructure/controllers/submissions.controller';
import { SqlWorker } from './infrastructure/queue/sql.worker';
import { PrismaSubmissionRepository } from './infrastructure/persistence/prisma-submission.repository';
import { PrismaSubmissionEligibilityQuery } from './infrastructure/persistence/prisma-submission-eligibility.query';
import { PrismaSubmissionEvaluationContextQuery } from './infrastructure/persistence/prisma-submission-evaluation.query';
import { SqlSandboxRunnerService } from './infrastructure/services/sql-sandbox-runner.service';
import { SubmissionStalledRecoveryService } from './infrastructure/services/submission-stalled-recovery.service';
import { CreateSubmissionUseCase } from './application/use-cases/create-submission.use-case';
import { EvaluateSubmissionUseCase } from './application/use-cases/evaluate-submission.use-case';
import { GetSubmissionByIdUseCase } from './application/use-cases/get-submission-by-id.use-case';
import { GetMySubmissionCountUseCase } from './application/use-cases/get-my-submission-count.use-case';
import { GetEvaluationLeaderboardUseCase } from './application/use-cases/get-evaluation-leaderboard.use-case';
import { SUBMISSION_REPOSITORY } from './domain/repositories/submission.repository.interface';
import { SUBMISSION_ELIGIBILITY_QUERY } from './domain/interfaces/submission-eligibility.query.tokens';
import { SUBMISSION_EVALUATION_CONTEXT_QUERY } from './domain/interfaces/submission-evaluation-context.query.tokens';
import { SQL_SANDBOX_RUNNER } from './domain/interfaces/sql-sandbox-runner.interface';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    ChallengesModule,
    AiModule,
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
    SqlSandboxRunnerService,
    SubmissionStalledRecoveryService,
    CreateSubmissionUseCase,
    EvaluateSubmissionUseCase,
    GetSubmissionByIdUseCase,
    GetMySubmissionCountUseCase,
    GetEvaluationLeaderboardUseCase,
    {
      provide: SUBMISSION_REPOSITORY,
      useClass: PrismaSubmissionRepository,
    },
    {
      provide: SUBMISSION_ELIGIBILITY_QUERY,
      useClass: PrismaSubmissionEligibilityQuery,
    },
    {
      provide: SUBMISSION_EVALUATION_CONTEXT_QUERY,
      useClass: PrismaSubmissionEvaluationContextQuery,
    },
    {
      provide: SQL_SANDBOX_RUNNER,
      useExisting: SqlSandboxRunnerService,
    },
  ],
})
export class SubmissionsModule {}
