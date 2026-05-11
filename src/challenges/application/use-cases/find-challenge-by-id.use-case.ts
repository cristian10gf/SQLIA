import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { Challenge } from '../../domain/entities/challenge.entity';

@Injectable()
export class FindChallengeByIdUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findById(id);

    if (!challenge) {
      throw new NotFoundException('El reto no existe');
    }

    return challenge;
  }
}
