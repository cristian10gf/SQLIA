import { Inject, Injectable } from '@nestjs/common';
import type { IAiProvider } from '../../domain/repositories/ai-provider.repository';
import { GenerateChallengeDto } from '../dtos/generate-challenge.dto';

@Injectable()
export class GenerateChallengeUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  async execute(dto: GenerateChallengeDto): Promise<string> {
    return await this.aiProvider.generateChallenge(dto.prompt);
  }
}
