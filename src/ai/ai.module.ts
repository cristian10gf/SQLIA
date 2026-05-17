import { Module } from '@nestjs/common';
import { AiService } from './infrastructure/services/ai.service';
import { AiController } from './infrastructure/controllers/ai.controller';
import { AnalyzeSqlUseCase } from './application/use-cases/analyze-sql.use-case';

@Module({
  controllers: [AiController],
  providers: [
    AnalyzeSqlUseCase,
    {
      provide: 'IAiProvider',
      useClass: AiService,
    },
  ],
  exports: ['IAiProvider', AnalyzeSqlUseCase],
})
export class AiModule {}
