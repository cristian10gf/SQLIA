import type { ChallengeSandboxStatusValue } from '../../../challenges/domain/repositories/challenge-sandbox.repository.interface';

export type SubmissionForEvaluationRow = {
  id: string;
  challengeId: string;
  query: string;
  challenge: {
    schemaDefinition: string;
    seedScript: string | null;
    expectedResult: unknown;
    timeLimitMs: number;
    databaseEngine: string;
  };
};

export type SandboxConnectionForEvaluation = {
  status: ChallengeSandboxStatusValue;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export interface ISubmissionEvaluationContextQuery {
  findSubmissionForEvaluation(
    submissionId: string,
  ): Promise<SubmissionForEvaluationRow | null>;
  findSandboxConnection(
    challengeId: string,
  ): Promise<SandboxConnectionForEvaluation | null>;
}
