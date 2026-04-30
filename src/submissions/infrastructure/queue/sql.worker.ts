import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../services/ai.service';
import { ISqlJob } from '../../domain/dtos/sql-job.dto';

@Processor('sql-evaluation')
export class SqlWorker extends WorkerHost {
  constructor(private readonly aiService: AiService) {
    super();
  }

  async process(job: Job<ISqlJob>): Promise<any> {
    console.log(`Procesando entrega: ${job.data.submissionId}`);

    const { submissionId } = job.data;

    console.log(`Job ID: ${submissionId}`);

    const feedback = await this.aiService.getOptimizationTips(
      job.data.query,
      job.data.schema,
    );

    console.log('--- Recomendaciones de Kimi ---');
    console.log(feedback);

    return { status: 'processed', feedback };
  }
}
