export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type EvaluationStatus = 'ACTIVE' | 'INACTIVE';

export type ChallengeStatus = 'PUBLIC' | 'PRIVATE';

export type SandboxStatusValue =
  | 'PENDING'
  | 'PROVISIONING'
  | 'READY'
  | 'ERROR'
  | 'EXPIRED';

export interface Challenge {
  id: number | string;
  title: string;
  description: string;
  difficulty: Difficulty;
  databaseEngine: string;
  visibility: ChallengeStatus;
  schemaDefinition: string;
  seedScript: string;
  points: number;
  expectedResult: any[] | { data: any[]; rowCount?: number } | string;
  timeLimitMs: number;
}

export interface Evaluation {
  id: number | string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status?: EvaluationStatus;
  durationMinutes: number;
  maxAttempts: number;
  isVisible: boolean;
  courseName: string;
  challenges: Challenge[];
}

export interface ChallengeFormErrors {
  title?: string;
  description?: string;
  difficulty?: string;
  databaseEngine?: string;
  visibility?: string;
  points?: string;
  schemaDefinition?: string;
  seedScript?: string;
  expectedResult?: string;
  timeLimitMs?: string;
}

export interface VisibleChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  databaseEngine: string;
  visibility: ChallengeStatus;
  schemaDefinition: string;
  seedScript: string;
  timeLimitMs: number;
  status: string;
  tags: string[];
  courseId: string;
  createdAt: string;
}

export interface EvaluationFormErrors {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  durationMinutes?: string;
  maxAttempts?: string;
  courseName?: string;
  challenges?: string;
}

export interface StudentSolutionErrors {
  query?: string;
}
