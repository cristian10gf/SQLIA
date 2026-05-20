import { Injectable } from '@nestjs/common';
import type {
  ApplySchemaSeedInSchemaOptions,
  ExecuteQueryOptions,
  ISqlExecutionPort,
  SqlConnectionParams,
  SqlRunnerDockerLimits,
} from '../../../domain/interfaces/sql-execution.interface';
import { EphemeralPostgresValidationRunner } from './ephemeral-postgres-validation.runner';
import { PostgresSqlExecutor } from './postgres-sql.executor';
import {
  resolveDockerMemoryBytes,
  resolveDockerNanoCpus,
  resolveSqlRunnerImage,
} from './sql-runner-environment';

/**
 * Fachada `ISqlExecutionPort`: delega en ejecutor Postgres y en validación Docker efímera.
 */
@Injectable()
export class SqlRunnerService implements ISqlExecutionPort {
  constructor(
    private readonly postgres: PostgresSqlExecutor,
    private readonly ephemeralValidation: EphemeralPostgresValidationRunner,
  ) {}

  validateSchemaSeed(
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void> {
    return this.runValidation(schemaDefinition, seedScript);
  }

  executeInSandbox(
    params: SqlConnectionParams,
    query: string,
    options: ExecuteQueryOptions,
  ): Promise<{ rows: unknown[]; durationMs: number }> {
    return this.postgres.executeQueryWithTimeout(params, query, options);
  }

  runValidation(schemaDefinition: string, seedScript?: string | null) {
    return this.ephemeralValidation.runValidation(schemaDefinition, seedScript);
  }

  waitForPostgresReady(
    params: SqlConnectionParams,
    options?: { maxAttempts?: number },
  ): Promise<void> {
    return this.postgres.waitForPostgresReady(params, options);
  }

  applySchemaAndSeedInSchema(
    params: SqlConnectionParams,
    options: ApplySchemaSeedInSchemaOptions,
  ): Promise<void> {
    return this.postgres.applySchemaAndSeedInSchema(params, options);
  }

  createSubmissionSchema(
    params: SqlConnectionParams,
    schemaName: string,
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void> {
    return this.postgres.applySchemaAndSeedInSchema(params, {
      targetSchema: schemaName,
      schemaDefinition,
      seedScript,
    });
  }

  executeQueryWithTimeout(
    params: SqlConnectionParams,
    query: string,
    options: ExecuteQueryOptions,
  ): Promise<{ rows: unknown[]; durationMs: number }> {
    return this.postgres.executeQueryWithTimeout(params, query, options);
  }

  executeScript(
    params: SqlConnectionParams,
    sql: string,
    options?: { searchPathSchema?: string },
  ): Promise<void> {
    return this.postgres.executeScript(params, sql, options);
  }

  dropSchemaIfExists(
    params: SqlConnectionParams,
    schemaName: string,
  ): Promise<void> {
    return this.postgres.dropSchemaIfExists(params, schemaName);
  }

  dropSubmissionSchema(
    params: SqlConnectionParams,
    schemaName: string,
  ): Promise<void> {
    return this.postgres.dropSchemaIfExists(params, schemaName);
  }

  dockerResourceLimits(): SqlRunnerDockerLimits {
    return {
      Memory: resolveDockerMemoryBytes(),
      NanoCpus: resolveDockerNanoCpus(),
    };
  }

  resolveRunnerImage(): string {
    return resolveSqlRunnerImage();
  }
}
