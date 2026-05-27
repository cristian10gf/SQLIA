import type {
  Challenge,
  ChallengeStatus,
  Difficulty,
  Evaluation,
  EvaluationStatus,
} from '../../domain/evaluationChallenge.types';

export const sampleSchemaSql = `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(80) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  total DECIMAL(10,2) NOT NULL,
  created_at DATE NOT NULL
);`;

export const sampleInitialDataSql = `INSERT INTO customers (name, city) VALUES
('Ana Pérez', 'Bogotá'),
('Carlos Ruiz', 'Medellín'),
('Laura Gómez', 'Cali');

INSERT INTO orders (customer_id, total, created_at) VALUES
(1, 150000, '2026-01-10'),
(1, 200000, '2026-01-12'),
(2, 90000, '2026-01-13');`;

export const emptyEvaluation: Omit<Evaluation, 'id'> = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  durationMinutes: 90,
  maxAttempts: 3,
  isVisible: false,
  courseName: '',
  challenges: [],
};

export const emptyChallenge: Omit<Challenge, 'id'> = {
  title: '',
  description: '',
  difficulty: 'EASY',
  databaseEngine: 'PostgreSQL',
  timeLimitMs: 2000,
  visibility: 'PUBLIC',
  points: 10,
  schemaDefinition: sampleSchemaSql,
  seedScript: sampleInitialDataSql,
  expectedResult: '',
};

export function getDifficultyLabel(difficulty: Difficulty) {
  if (difficulty === 'EASY') return 'Fácil';
  if (difficulty === 'MEDIUM') return 'Media';
  return 'Difícil';
}

export function getStatusLabel(status: EvaluationStatus) {
  return status === 'ACTIVE' ? 'Activa' : 'Inactiva';
}

export function getChallengeStatusLabel(status: ChallengeStatus) {
  if (status === 'PUBLIC') return 'Público';
  if (status === 'PRIVATE') return 'Privado';
  return 'Archivado';
}

export function formatDate(date: string) {
  if (!date) return 'Sin fecha';
  return new Date(date).toLocaleDateString();
}

export function isEvaluationOpen(evaluation: Evaluation) {
  const now = new Date();
  return now >= new Date(evaluation.startDate) && now <= new Date(evaluation.endDate);
}

export function isChallengeAvailableForStudent(evaluation: Evaluation, challenge: Challenge) {
  return isEvaluationOpen(evaluation) && challenge.visibility === 'PUBLIC';
}

export function formatAttemptCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (v: number) => v.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getAttemptRemainingMs(startedAt: number, durationMinutes: number, now: Date) {
  const durationMs = Math.max(1, durationMinutes) * 60 * 1000;
  return Math.max(0, durationMs - (now.getTime() - startedAt));
}

export function countPublishedChallenges(evaluations: Evaluation[]) {
  return evaluations.reduce(
    (total, ev) =>
      total + (ev.challenges?.filter((ch) => ch.visibility === 'PUBLIC').length || 0),
    0,
  );
}

export function getNextClosingDate(evaluations: Evaluation[]) {
  const active = evaluations.filter((ev) => ev.status === 'ACTIVE');
  if (!active.length) return 'Sin fecha';
  const sorted = [...active].sort((a, b) => a.endDate.localeCompare(b.endDate));
  return formatDate(sorted[0].endDate);
}

export type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';
export interface SessionUser { name: string; role: UserRole; }

function normalizeRole(value?: string | null): UserRole {
  const normalized = value?.toUpperCase();
  if (normalized === 'PROFESSOR' || normalized === 'PROFESOR') return 'PROFESSOR';
  if (normalized === 'STUDENT' || normalized === 'ESTUDIANTE') return 'STUDENT';
  return 'ADMIN';
}

export function getSessionUser(): SessionUser {
  const keys = ['user', 'authUser', 'currentUser', 'sqlia_user'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || parsed.fullName || parsed.username || parsed.email || 'Usuario SQLIA',
        role: normalizeRole(parsed.role),
      };
    } catch {
      continue;
    }
  }
  return {
    name: localStorage.getItem('name') || 'Usuario SQLIA',
    role: normalizeRole(localStorage.getItem('role') || localStorage.getItem('userRole')),
  };
}
