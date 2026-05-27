import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { ChallengeController } from './infrastructure/controllers/challenge.controller';
import { CreateChallengeUseCase } from './application/use-cases/create-challenge.use-case';
import { UpdateChallengeUseCase } from './application/use-cases/update-challenge.use-case';
import { DeleteChallengeUseCase } from './application/use-cases/delete-challenge.use-case';
import { FindChallengeByIdUseCase } from './application/use-cases/find-challenge-by-id.use-case';
import { FindChallengesByCourseUseCase } from './application/use-cases/find-challenges-by-course.use-case';
import { FindChallengesByProfessorUseCase } from './application/use-cases/find-challenges-by-professor.use-case';
import { FindVisibleChallengesByCourseUseCase } from './application/use-cases/find-visible-challenges-by-course.use-case';
import { FindVisibleChallengesByProfessorUseCase } from './application/use-cases/find-visible-challenges-by-professor.use-case';
import { ChangeChallengeVisibilityUseCase } from './application/use-cases/change-challenge-visibility.use-case';
import { EnqueueChallengeSandboxProvisionUseCase } from './application/use-cases/enqueue-challenge-sandbox-provision.use-case';
import { GetChallengeSandboxUseCase } from './application/use-cases/get-challenge-sandbox.use-case';
import { CHALLENGE_REPOSITORY } from './domain/repositories/challenge.repository.interface';
import { PrismaChallengeRepository } from './infrastructure/persistence/prisma-challenge.repository';
import { CHALLENGE_SANDBOX_REPOSITORY } from './domain/repositories/challenge-sandbox.repository.interface';
import { PrismaChallengeSandboxRepository } from './infrastructure/persistence/prisma-challenge-sandbox.repository';
import { PrismaChallengeCourseOwnershipQuery } from './infrastructure/persistence/prisma-challenge-course-ownership.query';
import { PrismaChallengeSandboxExpiresAtQuery } from './infrastructure/persistence/prisma-challenge-sandbox-expires-at.query';
import { PrismaChallengePublishForSandboxCommand } from './infrastructure/persistence/prisma-challenge-publish-for-sandbox.command';
import { PrismaChallengeArchiveOnSandboxTeardownCommand } from './infrastructure/persistence/prisma-challenge-archive-on-sandbox-teardown.command';
import {
  CHALLENGE_ARCHIVE_ON_SANDBOX_TEARDOWN_COMMAND,
  CHALLENGE_COURSE_OWNERSHIP_QUERY,
  CHALLENGE_PUBLISH_FOR_SANDBOX_COMMAND,
  CHALLENGE_SANDBOX_EXPIRES_AT_QUERY,
} from './domain/interfaces/challenge-provisioning.tokens';
import { ChallengeSandboxProvisioner } from './infrastructure/queue/challenge-sandbox-provisioner.service';
import { ChallengeSandboxWorker } from './infrastructure/queue/challenge-sandbox.worker';
import { ChallengeSandboxMaintenanceScheduler } from './infrastructure/schedule/challenge-sandbox-maintenance.scheduler';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    BullModule.registerQueue({
      name: 'challenge-sandbox',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
  ],
  controllers: [ChallengeController],
  providers: [
    CreateChallengeUseCase,
    UpdateChallengeUseCase,
    DeleteChallengeUseCase,
    FindChallengeByIdUseCase,
    FindChallengesByCourseUseCase,
    FindChallengesByProfessorUseCase,
    FindVisibleChallengesByCourseUseCase,
    FindVisibleChallengesByProfessorUseCase,
    ChangeChallengeVisibilityUseCase,
    EnqueueChallengeSandboxProvisionUseCase,
    GetChallengeSandboxUseCase,
    ChallengeSandboxProvisioner,
    ChallengeSandboxWorker,
    ChallengeSandboxMaintenanceScheduler,
    {
      provide: CHALLENGE_REPOSITORY,
      useClass: PrismaChallengeRepository,
    },
    {
      provide: CHALLENGE_SANDBOX_REPOSITORY,
      useClass: PrismaChallengeSandboxRepository,
    },
    {
      provide: CHALLENGE_COURSE_OWNERSHIP_QUERY,
      useClass: PrismaChallengeCourseOwnershipQuery,
    },
    {
      provide: CHALLENGE_SANDBOX_EXPIRES_AT_QUERY,
      useClass: PrismaChallengeSandboxExpiresAtQuery,
    },
    {
      provide: CHALLENGE_PUBLISH_FOR_SANDBOX_COMMAND,
      useClass: PrismaChallengePublishForSandboxCommand,
    },
    {
      provide: CHALLENGE_ARCHIVE_ON_SANDBOX_TEARDOWN_COMMAND,
      useClass: PrismaChallengeArchiveOnSandboxTeardownCommand,
    },
  ],
  exports: [
    CHALLENGE_SANDBOX_REPOSITORY,
    CHALLENGE_COURSE_OWNERSHIP_QUERY,
    CHALLENGE_SANDBOX_EXPIRES_AT_QUERY,
    CHALLENGE_PUBLISH_FOR_SANDBOX_COMMAND,
  ],
})
export class ChallengesModule {}
