import { Inject, Injectable } from '@nestjs/common';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { ListChallengesQueryDto } from '../dtos/list-challenges-query.dto';

@Injectable()
export class FindChallengesByCourseUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
  ) {}

  async execute(courseId: string, query?: ListChallengesQueryDto) {
    const { page = 1, limit = 10, visibility = 'all' } = query || {};
    const skip = (page - 1) * limit;

    const visibilityFilter =
      visibility === 'visible' ? true : visibility === 'invisible' ? false : undefined;

    return await this.challengeRepository.findByCourse(courseId, skip, limit, visibilityFilter, false);
  }
}