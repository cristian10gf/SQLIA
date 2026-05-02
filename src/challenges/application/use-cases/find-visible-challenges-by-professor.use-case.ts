import { Inject, Injectable } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { PaginationDto } from '../dtos/pagination.dto';

@Injectable()
export class FindVisibleChallengesByProfessorUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(professorId: string, pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    return await this.challengeRepository.findByProfessor(professorId, skip, limit, true, true);
  }
}
