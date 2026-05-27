import { Inject, Injectable } from '@nestjs/common';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type {
  ISubmissionRepository,
  SubmissionWithStudent,
} from '../../domain/repositories/submission.repository.interface';

@Injectable()
export class GetSubmissionsByEvaluationUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
  ) {}

  async execute(
    evaluationId: string,
    challengeId: string,
  ): Promise<SubmissionWithStudent[]> {
    return this.submissions.findByEvaluationAndChallenge(evaluationId, challengeId);
  }
}
