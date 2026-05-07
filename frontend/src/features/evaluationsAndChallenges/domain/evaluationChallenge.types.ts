export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type EvaluationStatus = 'ACTIVE' | 'INACTIVE';

export type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  tags: string;
  databaseEngine: string;
  timeLimit: number;
  status: ChallengeStatus;
  schemaSql: string;
  initialDataSql: string;
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
  points?: string;
  tags?: string;
  databaseEngine?: string;
  timeLimit?: string;
  status?: string;
  schemaSql?: string;
  initialDataSql?: string;
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