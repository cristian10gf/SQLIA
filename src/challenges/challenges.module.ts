import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
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
import { CHALLENGE_REPOSITORY } from './domain/repositories/challenge.repository.interface';
import { PrismaChallengeRepository } from './infrastructure/persistence/prisma-challenge.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [ChallengeController],
  providers: [
    SharedModule,
    CreateChallengeUseCase,
    UpdateChallengeUseCase,
    DeleteChallengeUseCase,
    FindChallengeByIdUseCase,
    FindChallengesByCourseUseCase,
    FindChallengesByProfessorUseCase,
    FindVisibleChallengesByCourseUseCase,
    FindVisibleChallengesByProfessorUseCase,
    ChangeChallengeVisibilityUseCase,
    {
      provide: CHALLENGE_REPOSITORY,
      useClass: PrismaChallengeRepository,
    },
  ],
})
export class ChallengesModule {}
