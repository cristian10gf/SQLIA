export type SubmissionStatusValue =
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'SYNTAX_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'OPTIMIZATION_REQUIRED';

export class Submission {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly challengeId: string,
    public readonly evaluationId: string | null,
    public readonly query: string,
    public readonly status: SubmissionStatusValue,
    public readonly executionTimeMs: number | null,
    public readonly score: number | null,
    public readonly resultJson: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
