import { Logger } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  ChallengeSandboxProvisioner,
  ChallengeSandboxJob,
} from './challenge-sandbox-provisioner.service';
import { BullLoggingWorkerHost } from '../../../shared/infrastructure/queue/bull-worker-host.base';
import {
  bullWorkerLockDurationMs,
  bullWorkerStalledIntervalMs,
} from '../../../shared/infrastructure/queue/bull-worker-settings';

@Processor('challenge-sandbox', {
  stalledInterval: bullWorkerStalledIntervalMs({
    envFallbackMs: '60000',
    invalidFallbackMs: 60_000,
  }),
  maxStalledCount: 1,
  lockDuration: bullWorkerLockDurationMs(
    'CHALLENGE_SANDBOX_LOCK_MS',
    600_000,
    60_000,
  ),
})
export class ChallengeSandboxWorker extends BullLoggingWorkerHost {
  protected readonly workerLogger = new Logger(ChallengeSandboxWorker.name);
  protected readonly queueDiagnosticTag = 'challenge-sandbox';

  constructor(private readonly provisioner: ChallengeSandboxProvisioner) {
    super();
  }

  async process(job: Job<ChallengeSandboxJob>): Promise<void> {
    const { action, challengeId } = job.data;
    this.workerLogger.log(`[${job.id}] ${action} ${challengeId}`);

    if (action === 'provision') {
      await this.provisioner.provision(challengeId);
    } else if (action === 'teardown') {
      await this.provisioner.teardown(challengeId);
    } else {
      this.workerLogger.warn(
        `Acción desconocida en job: ${JSON.stringify(job.data)}`,
      );
    }
  }
}
