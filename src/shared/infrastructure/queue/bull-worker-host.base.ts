import { Logger } from '@nestjs/common';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

/**
 * Base opcional para workers BullMQ: logging uniforme en fallos (infra compartida).
 * La “ejecución” sigue en cada feature (`process` delegando en servicios del módulo).
 */
export abstract class BullLoggingWorkerHost extends WorkerHost {
  protected abstract readonly workerLogger: Logger;
  protected abstract readonly queueDiagnosticTag: string;

  @OnWorkerEvent('failed')
  protected onWorkerJobFailed(job: Job): void {
    this.workerLogger.error(
      `${this.queueDiagnosticTag} job failed id=${job.id} name=${job.name}: ${job.failedReason}`,
    );
  }
}
