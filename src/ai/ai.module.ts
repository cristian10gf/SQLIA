import { Module } from '@nestjs/common';
import { AiService } from './infrastructure/services/ai.service';
import { AiController } from './infrastructure/controllers/ai.controller';
import { AnalyzeSqlUseCase } from './application/use-cases/analyze-sql.use-case';
import { GenerateDataUseCase } from './application/use-cases/generate-data.use-case';
import { GenerateChallengeUseCase } from './application/use-cases/generate-challenge.use-case';

@Module({
  controllers: [AiController],
  providers: [
    AnalyzeSqlUseCase,
    GenerateDataUseCase,
    GenerateChallengeUseCase,
    {
      provide: 'IAiProvider',
      useClass: AiService,
    },
  ],
  exports: [
    'IAiProvider',
    AnalyzeSqlUseCase,
    GenerateDataUseCase,
    GenerateChallengeUseCase,
  ],
})
export class AiModule {}
