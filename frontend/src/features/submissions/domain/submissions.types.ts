export type Submission = {
  query: string;
  challengeId: string;
  evaluationId: string;
};

export type SubmissionStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'SYNTAX_ERROR'
  | 'PERMISSION_ERROR';

export type SubmissionTest = {
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
};

export type SubmissionResult = {
  id: string;
  status: SubmissionStatus;
  score: number;
  executionTimeMs: number;
  createdAt: string;
  resultJson?: {
    status: SubmissionStatus;
    score: number;
    executionTimeMs?: number;
    engine?: string;
    tests?: SubmissionTest[];
    scoring?: Record<string, unknown>;
    error?: string;
    aiRecommendations?: string;
    message?: string;
  };
};

export type LeaderboardEntry = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalScore: number;
  challengesSolved: number;
  submissionCount: number;
};
