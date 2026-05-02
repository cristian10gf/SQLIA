import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { Challenge } from '../../domain/entities/challenge.entity';
import { UpdateChallengeDto } from '../dtos/update-challenge.dto';

@Injectable()
export class UpdateChallengeUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(id: string, dto: UpdateChallengeDto): Promise<Challenge> {
    const existingChallenge = await this.challengeRepository.findById(id);

    if (!existingChallenge) {
      throw new NotFoundException('El reto no existe');
    }

    const data: Partial<Challenge> = {
      title: dto.title,
      description: dto.description,
      difficulty: dto.difficulty,
      visibility: dto.visibility,
      databaseEngine: dto.databaseEngine,
      schemaDefinition: dto.schemaDefinition,
      seedScript: dto.seedScript,
      expectedResult: dto.expectedResult,
      timeLimitMs: dto.timeLimitMs,
    };

    return await this.challengeRepository.update(id, data);
  }
}
