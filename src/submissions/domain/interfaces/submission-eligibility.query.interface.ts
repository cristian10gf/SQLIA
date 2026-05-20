import type { ChallengeSandboxStatusValue } from '../../../challenges/domain/repositories/challenge-sandbox.repository.interface';

export type ChallengeForSubmissionRow = {
  id: string;
  courseId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

export interface ISubmissionEligibilityQuery {
  findChallengeForSubmission(
    challengeId: string,
  ): Promise<ChallengeForSubmissionRow | null>;
  isStudentEnrolledInCourse(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;
  existsVisibleEvaluationForChallenge(params: {
    evaluationId: string;
    challengeId: string;
    courseId: string;
  }): Promise<boolean>;
  getChallengeSandboxStatus(
    challengeId: string,
  ): Promise<ChallengeSandboxStatusValue | null>;
}
