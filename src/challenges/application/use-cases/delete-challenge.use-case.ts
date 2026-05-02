import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';

@Injectable()
export class DeleteChallengeUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingChallenge = await this.challengeRepository.findById(id);

    if (!existingChallenge) {
      throw new NotFoundException('El reto no existe');
    }

    await this.challengeRepository.delete(id);
  }
}
