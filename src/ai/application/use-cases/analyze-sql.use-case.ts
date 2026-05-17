import { Inject, Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/repositories/ai-provider.repository';
import { AnalyzeSqlInput } from '../../domain/entities/analyze.entity';

@Injectable()
export class AnalyzeSqlUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  async execute(input: AnalyzeSqlInput): Promise<string> {
    return await this.aiProvider.getOptimizationTips(input.query, input.schema);
  }
}
