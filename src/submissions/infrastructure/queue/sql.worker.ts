import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../services/ai.service';
import { ISqlJob } from '../../domain/dtos/sql-job.dto';
import { EvaluateSqlUseCase } from '../../application/use-cases/evaluate-sql.use-case';

@Processor('sql-evaluation')
export class SqlWorker extends WorkerHost {
  constructor(private readonly evaluateSqlUseCase: EvaluateSqlUseCase) {
    super();
  }

  async process(job: Job<ISqlJob>): Promise<any> {
    console.log(`Procesando entrega: ${job.data.submissionId}`);

    const result = await this.evaluateSqlUseCase.execute(job.data);
    console.log(result);
    return result;
  }
}
