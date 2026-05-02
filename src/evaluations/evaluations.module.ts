import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationController } from './infrastructure/controllers/evaluation.controller';
import { CreateEvaluationUseCase } from './application/use-cases/create-evaluation.use-case';
import { UpdateEvaluationUseCase } from './application/use-cases/update-evaluation.use-case';
import { DeleteEvaluationUseCase } from './application/use-cases/delete-evaluation.use-case';
import { FindEvaluationByIdUseCase } from './application/use-cases/find-evaluation-by-id.use-case';
import { FindEvaluationsByCourseUseCase } from './application/use-cases/find-evaluations-by-course.use-case';
import { FindVisibleEvaluationsByCourseUseCase } from './application/use-cases/find-visible-evaluations-by-course.use-case';
import { ChangeEvaluationVisibilityUseCase } from './application/use-cases/change-evaluation-visibility.use-case';
import { EVALUATION_REPOSITORY } from './domain/repositories/evaluation.repository.interface';
import { PrismaEvaluationRepository } from './infrastructure/persistence/prisma-evaluation.repository';

@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [
    CreateEvaluationUseCase,
    UpdateEvaluationUseCase,
    DeleteEvaluationUseCase,
    FindEvaluationByIdUseCase,
    FindEvaluationsByCourseUseCase,
    FindVisibleEvaluationsByCourseUseCase,
    ChangeEvaluationVisibilityUseCase,
    {
      provide: EVALUATION_REPOSITORY,
      useClass: PrismaEvaluationRepository,
    },
  ],
})
export class EvaluationsModule {}