/** Origen del fallo al aplicar DDL/semilla (validación o sandbox). */
export type SqlSchemaFailureOrigin = 'ESQUEMA' | 'DATOS_INICIALES';

export interface SqlConnectionParams {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ApplySchemaSeedInSchemaOptions {
  /** Schema destino (p. ej. `challenge_base` o `sub_<uuid>`). */
  targetSchema: string;
  schemaDefinition: string;
  seedScript?: string | null;
}

export interface ExecuteQueryOptions {
  statementTimeoutMs: number;
  /** Si se define, se hace `SET search_path TO <schema>, public` antes de la consulta. */
  searchPathSchema?: string;
}

/** Límites de CPU/memoria Docker (nanoCpus/memoria bytes) como espera Dockerode `HostConfig`. */
export interface SqlRunnerDockerLimits {
  Memory: number;
  NanoCpus: number;
}

/**
 * Ejecución SQL aislada (Docker efímero o contenedor sandbox).
 * Implementación en infraestructura; casos de uso/workers usan `SQL_EXECUTION_PORT`.
 *
 * El ciclo de vida del contenedor nombrado por reto (`provision` / `teardown`) está en
 * `ChallengeSandboxProvisioner`; esta interfaz cubre validación, DDL por schema y consultas.
 */
export interface ISqlExecutionPort {
  /** Contenedor Postgres efímero: valida DDL + semilla en `public` (AutoRemove). */
  runValidation(
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void>;

  /** Misma semántica que `runValidation`. */
  validateSchemaSeed(
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void>;

  /** Aplica DDL + semilla en un schema concreto vía `search_path`. */
  applySchemaAndSeedInSchema(
    params: SqlConnectionParams,
    options: ApplySchemaSeedInSchemaOptions,
  ): Promise<void>;

  /** Schema dedicado por submission: DDL + semilla del reto. */
  createSubmissionSchema(
    params: SqlConnectionParams,
    schemaName: string,
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void>;

  waitForPostgresReady(
    params: SqlConnectionParams,
    options?: { maxAttempts?: number },
  ): Promise<void>;

  /** Ejecuta la consulta con `statement_timeout` y `search_path` opcional. */
  executeQueryWithTimeout(
    params: SqlConnectionParams,
    query: string,
    options: ExecuteQueryOptions,
  ): Promise<{ rows: unknown[]; durationMs: number }>;

  executeInSandbox(
    params: SqlConnectionParams,
    query: string,
    options: ExecuteQueryOptions,
  ): Promise<{ rows: unknown[]; durationMs: number }>;

  executeScript(
    params: SqlConnectionParams,
    sql: string,
    options?: { searchPathSchema?: string },
  ): Promise<void>;

  dropSchemaIfExists(params: SqlConnectionParams, schemaName: string): Promise<void>;

  dropSubmissionSchema(params: SqlConnectionParams, schemaName: string): Promise<void>;

  resolveRunnerImage(): string;

  dockerResourceLimits(): SqlRunnerDockerLimits;
}
