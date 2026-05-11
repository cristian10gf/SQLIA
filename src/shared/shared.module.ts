import { Module } from '@nestjs/common';
import { SqlRunnerService } from './infrastructure/services/sql-runner.service';

@Module({
  providers: [SqlRunnerService],
  exports: [SqlRunnerService],
})
export class SharedModule {}
