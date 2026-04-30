import { Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/interfaces/ai-provider.interface';
import { ISqlJob } from '../../domain/dtos/sql-job.dto';

@Injectable()
export class EvaluateSqlUseCase {
  constructor(private readonly aiProvider: IAiProvider) {}
  async execute(data: ISqlJob) {
    return await this.aiProvider.getOptimizationTips(data.query, data.schema);
  }
}
