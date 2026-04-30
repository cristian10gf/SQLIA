import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsController } from './infrastructure/http/submissions.controller';
import { EvaluateSqlUseCase } from './application/use-cases/evaluate-sql.use-case';
import { AiService } from './infrastructure/services/ai.service';
import { SqlWorker } from './infrastructure/queue/sql.worker';

@Module({
  imports: [
    // Registro de la cola específica para este módulo
    BullModule.registerQueue({
      name: 'sql-evaluation',
      defaultJobOptions: {
        attempts: 2,
        backoff: 5000,
      },
    }),
  ],
  controllers: [SubmissionsController], // Antes era AppController
  providers: [
    EvaluateSqlUseCase,
    SqlWorker, // El procesador que escucha Redis
    {
      provide: 'IAiProvider', // Token para inyección de dependencia en el Use Case
      useClass: AiService,
    },
  ],
  exports: [EvaluateSqlUseCase], // Por si otros módulos necesitan usarlo
})
export class SubmissionsModule {}
