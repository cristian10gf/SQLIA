import { Inject, Injectable } from '@nestjs/common';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface';

@Injectable()
export class GetMySubmissionCountUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
  ) {}

  async execute(studentId: string, evaluationId: string): Promise<{ count: number }> {
    const count = await this.submissions.countByStudentAndEvaluation(studentId, evaluationId);
    return { count };
  }
}
