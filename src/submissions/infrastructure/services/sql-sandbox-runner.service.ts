import { Inject, Injectable } from '@nestjs/common';
import { SQL_EXECUTION_PORT } from '../../../shared/domain/interfaces/sql-execution.tokens';
import type { ISqlExecutionPort } from '../../../shared/domain/interfaces/sql-execution.interface';
import type {
  ISqlSandboxRunner,
  SandboxExecutionInput,
  SandboxExecutionResult,
} from '../../domain/interfaces/sql-sandbox-runner.interface';
import type { SqlConnectionParams } from '../../../shared/domain/interfaces/sql-execution.interface';

@Injectable()
export class SqlSandboxRunnerService implements ISqlSandboxRunner {
  constructor(
    @Inject(SQL_EXECUTION_PORT) private readonly sql: ISqlExecutionPort,
  ) {}

  async executeInIsolatedSchema(
    input: SandboxExecutionInput,
  ): Promise<SandboxExecutionResult> {
    const { connection, schemaName, schemaDefinition, seedScript, query, timeLimitMs } =
      input;

    try {
      await this.sql.createSubmissionSchema(
        connection,
        schemaName,
        schemaDefinition,
        seedScript,
      );
    } catch (setupError) {
      return { ok: false, error: setupError };
    }

    try {
      const exec = await this.sql.executeInSandbox(connection, query, {
        statementTimeoutMs: timeLimitMs,
        searchPathSchema: schemaName,
      });
      return { ok: true, rows: exec.rows, durationMs: exec.durationMs };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async dropSchema(
    connection: SqlConnectionParams,
    schemaName: string,
  ): Promise<void> {
    await this.sql.dropSubmissionSchema(connection, schemaName);
  }
}
