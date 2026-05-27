import { Inject, Injectable } from '@nestjs/common';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository, LeaderboardEntry } from '../../domain/repositories/submission.repository.interface';

@Injectable()
export class GetEvaluationLeaderboardUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
  ) {}

  async execute(evaluationId: string): Promise<LeaderboardEntry[]> {
    return this.submissions.getLeaderboard(evaluationId);
  }
}
