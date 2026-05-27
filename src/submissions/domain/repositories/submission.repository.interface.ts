import {
  Submission,
  SubmissionStatusValue,
} from '../entities/submission.entity';

export const SUBMISSION_REPOSITORY = Symbol('SUBMISSION_REPOSITORY');

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalScore: number;
  challengesSolved: number;
  submissionCount: number;
}

export interface CreateSubmissionData {
  id: string;
  studentId: string;
  challengeId: string;
  evaluationId?: string | null;
  query: string;
}

export interface ISubmissionRepository {
  create(data: CreateSubmissionData): Promise<Submission>;
  findById(id: string): Promise<Submission | null>;
  findByIdAndStudent(id: string, studentId: string): Promise<Submission | null>;
  updateStatus(id: string, status: SubmissionStatusValue): Promise<void>;
  updateResult(
    id: string,
    data: {
      status: SubmissionStatusValue;
      score: number;
      executionTimeMs: number;
      resultJson: Record<string, any>;
    },
  ): Promise<void>;
  /** Retorna submissions en RUNNING más antiguas que `olderThanMs`. */
  findStuckRunning(olderThanMs: number): Promise<Submission[]>;
  /** Transición atómica QUEUED → RUNNING; retorna true si se actualizó. */
  claimForProcessing(id: string): Promise<boolean>;
  countByStudentAndEvaluation(studentId: string, evaluationId: string): Promise<number>;
  getLeaderboard(evaluationId: string): Promise<LeaderboardEntry[]>;
}
