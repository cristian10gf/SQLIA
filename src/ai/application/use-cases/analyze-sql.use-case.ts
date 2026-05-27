import { Inject, Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/repositories/ai-provider.repository';
import { AnalyzeSqlDto } from '../dtos/analyze-sql.dto';

@Injectable()
export class AnalyzeSqlUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  async execute(dto: AnalyzeSqlDto): Promise<string> {
    return await this.aiProvider.getOptimizationTips(
      dto.query,
      dto.expected,
      dto.results,
    );
  }
}
