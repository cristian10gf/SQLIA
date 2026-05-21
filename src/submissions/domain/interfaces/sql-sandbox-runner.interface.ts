import type { SqlConnectionParams } from '../../../shared/domain/interfaces/sql-execution.interface';

export interface SandboxExecutionInput {
  connection: SqlConnectionParams;
  schemaName: string;
  schemaDefinition: string;
  seedScript: string | null;
  query: string;
  timeLimitMs: number;
}

export interface SandboxExecutionSuccess {
  ok: true;
  rows: unknown[];
  durationMs: number;
}

export interface SandboxExecutionFailure {
  ok: false;
  error: unknown;
}

export type SandboxExecutionResult =
  | SandboxExecutionSuccess
  | SandboxExecutionFailure;

export interface ISqlSandboxRunner {
  executeInIsolatedSchema(
    input: SandboxExecutionInput,
  ): Promise<SandboxExecutionResult>;
  dropSchema(connection: SqlConnectionParams, schemaName: string): Promise<void>;
}

export const SQL_SANDBOX_RUNNER = Symbol('SQL_SANDBOX_RUNNER');
