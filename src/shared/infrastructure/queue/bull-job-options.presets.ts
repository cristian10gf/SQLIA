import type { JobsOptions } from 'bullmq';

/** Encolar evaluación SQL tras crear submission. */
export const SQL_EVALUATION_ENQUEUE_OPTS: JobsOptions = {
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 100 },
};

/** Encolar provision inicial del sandbox por reto. */
export const CHALLENGE_SANDBOX_PROVISION_ENQUEUE_OPTS: JobsOptions = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 4000 },
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 20 },
};

const TEARDOWN_RETRY: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
};

export function challengeSandboxDeferredTeardownOpts(
  challengeId: string,
  delayMs: number,
): JobsOptions {
  return {
    ...TEARDOWN_RETRY,
    jobId: `teardown-${challengeId}`,
    delay: delayMs,
  };
}

export function challengeSandboxTeardownCatchupOpts(
  challengeId: string,
  uniqueSuffixMs: number,
): JobsOptions {
  return {
    ...TEARDOWN_RETRY,
    jobId: `teardown-catchup-${challengeId}-${uniqueSuffixMs}`,
    removeOnComplete: { count: 20 },
  };
}
