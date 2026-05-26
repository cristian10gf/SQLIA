import { Inject, Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/repositories/ai-provider.repository';
import { GenerateDataDto } from '../dtos/generate-data.dto';

@Injectable()
export class GenerateDataUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  async execute(dto: GenerateDataDto): Promise<string> {
    return await this.aiProvider.generateRandomData(dto.schema, dto.prompt);
  }
}
