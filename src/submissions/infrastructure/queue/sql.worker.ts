import { Logger } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SqlEvaluationService } from '../services/sql-evaluation.service';
import { BullLoggingWorkerHost } from '../../../shared/infrastructure/queue/bull-worker-host.base';
import {
  bullWorkerLockDurationMs,
  bullWorkerStalledIntervalMs,
} from '../../../shared/infrastructure/queue/bull-worker-settings';

interface EvaluateSubmissionJob {
  submissionId: string;
}

@Processor('sql-evaluation', {
  stalledInterval: bullWorkerStalledIntervalMs({
    envFallbackMs: '45000',
    invalidFallbackMs: 45_000,
  }),
  maxStalledCount: 2,
  lockDuration: bullWorkerLockDurationMs(
    'SQL_EVALUATION_LOCK_MS',
    120_000,
    10_000,
  ),
})
export class SqlWorker extends BullLoggingWorkerHost {
  protected readonly workerLogger = new Logger(SqlWorker.name);
  protected readonly queueDiagnosticTag = 'sql-evaluation';

  constructor(private readonly evaluationService: SqlEvaluationService) {
    super();
  }

  async process(job: Job<EvaluateSubmissionJob>): Promise<void> {
    const { submissionId } = job.data;
    this.workerLogger.log(`[${job.id}] evaluando submission ${submissionId}`);
    await this.evaluationService.evaluateSubmission(submissionId);
  }
}
