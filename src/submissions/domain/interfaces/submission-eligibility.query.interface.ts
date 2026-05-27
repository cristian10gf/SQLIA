import type { ChallengeSandboxStatusValue } from '../../../challenges/domain/repositories/challenge-sandbox.repository.interface';

export type ChallengeForSubmissionRow = {
  id: string;
  courseId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
};

export type EvaluationForSubmissionRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  maxAttempts: number;
};

export interface ISubmissionEligibilityQuery {
  findChallengeForSubmission(
    challengeId: string,
  ): Promise<ChallengeForSubmissionRow | null>;
  isStudentEnrolledInCourse(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;
  findEvaluationForSubmission(params: {
    evaluationId: string;
    challengeId: string;
    courseId: string;
  }): Promise<EvaluationForSubmissionRow | null>;
  countStudentSubmissionsInEvaluation(
    studentId: string,
    evaluationId: string,
  ): Promise<number>;
  findFirstSubmissionTimeInEvaluation(
    studentId: string,
    evaluationId: string,
  ): Promise<Date | null>;
  getChallengeSandboxStatus(
    challengeId: string,
  ): Promise<ChallengeSandboxStatusValue | null>;
}
