export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type EvaluationStatus = 'ACTIVE' | 'INACTIVE';

export type ChallengeStatus = 'PUBLIC' | 'PRIVATE';

export interface Challenge {
  id: number;
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
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: EvaluationStatus;
  durationMinutes: number;
  maxAttempts: number;
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
