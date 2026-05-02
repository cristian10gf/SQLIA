import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { Challenge } from '../../domain/entities/challenge.entity';
import { ChallengeVisibility as DomainChallengeVisibility } from '../../domain/enums/challenge-visibility.enum';
import { ChallengeVisibility as PrismaChallengeVisibility } from '@prisma/client';

@Injectable()
export class ChangeChallengeVisibilityUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(id: string, visibility: DomainChallengeVisibility): Promise<Challenge> {
    const existingChallenge = await this.challengeRepository.findById(id);

    if (!existingChallenge) {
      throw new NotFoundException('El reto no existe');
    }

    const prismaVisibility = visibility as unknown as PrismaChallengeVisibility;

    return await this.challengeRepository.updateVisibility(id, prismaVisibility);
  }
}
