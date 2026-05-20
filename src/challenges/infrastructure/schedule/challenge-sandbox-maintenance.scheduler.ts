import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Interval } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { CHALLENGE_SANDBOX_REPOSITORY } from '../../domain/repositories/challenge-sandbox.repository.interface';
import type { IChallengeSandboxRepository } from '../../domain/repositories/challenge-sandbox.repository.interface';
import {
  ChallengeSandboxJob,
  ChallengeSandboxProvisioner,
} from '../queue/challenge-sandbox-provisioner.service';
import { challengeSandboxTeardownCatchupOpts } from '../../../shared/infrastructure/queue/bull-job-options.presets';

function maintenanceIntervalMs(): number {
  const raw = parseInt(
    process.env.SANDBOX_MAINTENANCE_INTERVAL_MS ?? '600000',
    10,
  );
  return Number.isFinite(raw) && raw >= 60_000 ? raw : 600_000;
}

function provisioningStaleMs(): number {
  const raw = parseInt(
    process.env.SANDBOX_PROVISIONING_STALE_MS ?? '3600000',
    10,
  );
  return Number.isFinite(raw) && raw >= 120_000 ? raw : 3_600_000;
}

const MAINTENANCE_TICK_MS = maintenanceIntervalMs();

/**
 * Periodicidad configurable con `SANDBOX_MAINTENANCE_INTERVAL_MS` (default 10 min).
 * - PROVISIONING demasiado tiempo → limpia Docker y marca ERROR (`SANDBOX_PROVISIONING_STALE_MS`, default 1 h).
 * - READY con `expiresAt` pasado → re-encola `teardown` por si el job diferido de Bull se perdió.
 */
@Injectable()
export class ChallengeSandboxMaintenanceScheduler {
  private readonly logger = new Logger(
    ChallengeSandboxMaintenanceScheduler.name,
  );

  constructor(
    @Inject(CHALLENGE_SANDBOX_REPOSITORY)
    private readonly sandboxes: IChallengeSandboxRepository,
    private readonly provisioner: ChallengeSandboxProvisioner,
    @InjectQueue('challenge-sandbox') private readonly sandboxQueue: Queue,
  ) {}

  @Interval(MAINTENANCE_TICK_MS)
  async handleSandboxMaintenance(): Promise<void> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - provisioningStaleMs());

    const stuckIds =
      await this.sandboxes.findChallengeIdsProvisioningOlderThan(staleBefore);
    for (const challengeId of stuckIds) {
      try {
        await this.provisioner.recoverStaleProvisioning(challengeId);
        this.logger.warn(
          `Sandbox PROVISIONING recuperado (timeout) reto=${challengeId}`,
        );
      } catch (e) {
        this.logger.error(
          `Falló recoverStaleProvisioning ${challengeId}: ${e}`,
        );
      }
    }

    const expiredIds = await this.sandboxes.findChallengeIdsReadyExpired(now);
    for (const challengeId of expiredIds) {
      await this.sandboxQueue.add(
        'teardown',
        { action: 'teardown', challengeId } satisfies ChallengeSandboxJob,
        challengeSandboxTeardownCatchupOpts(challengeId, now.getTime()),
      );
      this.logger.log(
        `Teardown catch-up encolado reto=${challengeId} (sandbox vencido)`,
      );
    }
  }
}
