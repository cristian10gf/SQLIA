import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationChallengeController } from './infrastructure/controllers/evaluation-challenge.controller';
import { CreateEvaluationChallengeUseCase } from './application/use-cases/create-evaluation-challenge.use-case';
import { UpdateEvaluationChallengeUseCase } from './application/use-cases/update-evaluation-challenge.use-case';
import { DeleteEvaluationChallengeUseCase } from './application/use-cases/delete-evaluation-challenge.use-case';
import { FindChallengesByEvaluationUseCase } from './application/use-cases/find-challenges-by-evaluation.use-case';
import { FindVisibleChallengesByEvaluationUseCase } from './application/use-cases/find-visible-challenges-by-evaluation.use-case';
import { EVALUATION_CHALLENGE_REPOSITORY } from './domain/repositories/evaluation-challenge.repository.interface';
import { PrismaEvaluationChallengeRepository } from './infrastructure/persistence/prisma-evaluation-challenge.repository';

@Module({
  imports: [PrismaModule],
  controllers: [EvaluationChallengeController],
  providers: [
    CreateEvaluationChallengeUseCase,
    UpdateEvaluationChallengeUseCase,
    DeleteEvaluationChallengeUseCase,
    FindChallengesByEvaluationUseCase,
    FindVisibleChallengesByEvaluationUseCase,
    {
      provide: EVALUATION_CHALLENGE_REPOSITORY,
      useClass: PrismaEvaluationChallengeRepository,
    },
  ],
})
export class EvaluationChallengesModule {}
