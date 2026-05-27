import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Tick de recuperación: `SUBMISSION_RECOVERY_INTERVAL_MS` o `SUBMISSION_RUNNING_RECOVERY_INTERVAL_MS` (default 5 min). */
const SUBMISSION_RECOVERY_TICK_MS = (() => {
  const raw = Number.parseInt(
    process.env.SUBMISSION_RECOVERY_INTERVAL_MS ??
      process.env.SUBMISSION_RUNNING_RECOVERY_INTERVAL_MS ??
      '300000',
    10,
  );
  return Number.isFinite(raw) && raw >= 10_000 ? raw : 300_000;
})();

/**
 * Marca en BD submissions en RUNNING demasiado antiguas como RUNTIME_ERROR.
 * Complementa `stalledInterval` de BullMQ cuando el proceso reinicia o Docker falla.
 */
@Injectable()
export class SubmissionStalledRecoveryService {
  private readonly logger = new Logger(SubmissionStalledRecoveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Interval(SUBMISSION_RECOVERY_TICK_MS)
  async recoverStaleRunningSubmissions(): Promise<void> {
    const raw = parseInt(
      process.env.SUBMISSION_RUNNING_STALE_MS || '900000',
      10,
    );
    const thresholdMs = Number.isFinite(raw) ? raw : 900_000;
    const staleBefore = new Date(Date.now() - thresholdMs);
    const res = await this.prisma.submission.updateMany({
      where: {
        status: SubmissionStatus.RUNNING,
        updatedAt: { lt: staleBefore },
      },
      data: {
        status: SubmissionStatus.RUNTIME_ERROR,
        score: 0,
        resultJson: {
          recovered: true,
          reason:
            'RUNNING excedió umbral sin finalizar (worker o contenedor caído).',
        },
      },
    });
    if (res.count > 0) {
      this.logger.warn(
        `Recuperadas ${res.count} submissions RUNNING obsoletas`,
      );
    }
  }
}
