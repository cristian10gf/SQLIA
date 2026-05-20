import { Module } from '@nestjs/common';
import { SqlRunnerService } from './infrastructure/services/sql-runner/sql-runner.service';
import { PostgresSqlExecutor } from './infrastructure/services/sql-runner/postgres-sql.executor';
import { EphemeralPostgresValidationRunner } from './infrastructure/services/sql-runner/ephemeral-postgres-validation.runner';
import { SQL_EXECUTION_PORT } from './domain/interfaces/sql-execution.tokens';

@Module({
  providers: [
    PostgresSqlExecutor,
    EphemeralPostgresValidationRunner,
    SqlRunnerService,
    {
      provide: SQL_EXECUTION_PORT,
      useExisting: SqlRunnerService,
    },
  ],
  exports: [SqlRunnerService, SQL_EXECUTION_PORT],
})
export class SharedModule {}
