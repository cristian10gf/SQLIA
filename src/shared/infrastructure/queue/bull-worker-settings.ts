/** Intervalo stalled BullMQ desde env (compartido por workers). */
export function bullWorkerStalledIntervalMs(params: {
  /** Valor por defecto si env no está definido (string para parseInt). */
  envFallbackMs?: string;
  /** Si el número parseado es inválido o &lt; 5000 ms. */
  invalidFallbackMs: number;
}): number {
  const envFallback =
    params.envFallbackMs ?? String(params.invalidFallbackMs);
  const raw =
    process.env.BULL_STALLED_INTERVAL_MS ??
    process.env.BULLMQ_STALLED_INTERVAL_MS ??
    envFallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 5000) {
    return params.invalidFallbackMs;
  }
  return Math.min(parsed, 3_600_000);
}

export function bullWorkerLockDurationMs(
  envKey: string,
  fallbackMs: number,
  minimumMs = 10_000,
): number {
  const raw = process.env[envKey] ?? String(fallbackMs);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > minimumMs
    ? parsed
    : fallbackMs;
}
