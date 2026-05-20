export const DEFAULT_RUNNER_IMAGE = 'postgres:16';
export const DEFAULT_MEMORY_BYTES = 512 * 1024 * 1024;
export const DEFAULT_NANO_CPUS = 500000000;

export function resolveSqlRunnerImage(): string {
  return (
    process.env.SANDBOX_POSTGRES_IMAGE ||
    process.env.SQL_RUNNER_IMAGE ||
    DEFAULT_RUNNER_IMAGE
  );
}

export function resolveDockerMemoryBytes(): number {
  const raw = process.env.SQL_RUNNER_MEMORY_BYTES;
  return raw
    ? parseInt(raw, 10) || DEFAULT_MEMORY_BYTES
    : DEFAULT_MEMORY_BYTES;
}

export function resolveDockerNanoCpus(): number {
  const raw = process.env.SQL_RUNNER_NANO_CPUS;
  return raw ? parseInt(raw, 10) || DEFAULT_NANO_CPUS : DEFAULT_NANO_CPUS;
}
