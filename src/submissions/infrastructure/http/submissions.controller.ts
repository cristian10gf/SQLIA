import { Controller, Post, Body } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('submissions')
export class SubmissionsController {
  constructor(
    @InjectQueue('sql-evaluation') private readonly sqlQueue: Queue,
  ) {}

  @Post('eval')
  async triggerEvaluation(@Body() data: { query: string; schema: string }) {
    // Añadimos el trabajo a la cola de Redis
    const job = await this.sqlQueue.add('evaluate-sql', {
      submissionId: `test-${Date.now()}`,
      query: data.query,
      schema: data.schema,
      expectedResult: {}, // Dummy para el PoC
    });

    return {
      message: 'Evaluación enviada a la cola',
      jobId: job.id,
    };
  }
}
