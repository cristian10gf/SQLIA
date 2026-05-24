import { Inject, Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/repositories/ai-provider.repository';

@Injectable()
export class AnalyzeSqlUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  async execute(schema: string, prompt: string): Promise<string> {
    return await this.aiProvider.generateRandomData(schema, prompt);
  }
}
