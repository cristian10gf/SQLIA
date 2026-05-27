import type { SubmissionStatusValue } from '../entities/submission.entity';
import {
  SUBMISSION_SCORING_WEIGHTS,
  type ScoringBreakdown,
  type ScoringComponentScores,
} from './submission-scoring.weights';

export interface TestCaseResult {
  caseId: number;
  passed: boolean;
  detail?: string;
}

export interface ComputeScoreInput {
  tests: TestCaseResult[];
  executionTimeMs: number;
  timeLimitMs: number;
  query: string;
  errorStatus?: SubmissionStatusValue;
}

export interface ComputeScoreResult {
  breakdown: ScoringBreakdown;
  status: SubmissionStatusValue;
  score: number;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCorrectness(tests: TestCaseResult[]): number {
  if (tests.length === 0) {
    return 0;
  }
  const passed = tests.filter((t) => t.passed).length;
  return clampScore((passed / tests.length) * 100);
}

function scorePerformance(
  executionTimeMs: number,
  timeLimitMs: number,
  optRatio: number,
): number {
  if (executionTimeMs <= 0 || timeLimitMs <= 0) {
    return 0;
  }
  const ratio = executionTimeMs / timeLimitMs;
  if (ratio <= optRatio) {
    return 100;
  }
  if (ratio >= 1) {
    return 0;
  }
  return clampScore((100 * (1 - ratio)) / (1 - optRatio));
}

function scoreSqlUsage(query: string): number {
  let score = 100;
  const normalized = query.trim();
  const upper = normalized.toUpperCase();

  if (/\bSELECT\s+\*\b/.test(upper)) {
    score -= 35;
  }
  if (/\bSELECT\s+DISTINCT\s+\*\b/.test(upper)) {
    score -= 10;
  }
  if (!/\b(WHERE|JOIN|GROUP BY|HAVING|LIMIT)\b/.test(upper) && upper.includes('FROM')) {
    score -= 10;
  }
  if (/\b(CURSOR|DECLARE|EXECUTE\s+IMMEDIATE)\b/.test(upper)) {
    score -= 25;
  }

  return clampScore(score);
}

function scoreClarity(query: string): number {
  let score = 100;
  const normalized = query.trim();

  if (normalized.length > 2500) {
    score -= 20;
  }
  if (normalized.length > 120 && !normalized.includes('\n')) {
    score -= 15;
  }
  const joinCount = (normalized.match(/\bJOIN\b/gi) ?? []).length;
  const aliasHints = (normalized.match(/\b(?:FROM|JOIN)\s+\w+\s+\w+\b/gi) ?? []).length;
  if (joinCount >= 2 && aliasHints < joinCount) {
    score -= 15;
  }

  return clampScore(score);
}

function scoreRecommendations(): number {
  return 100;
}

function weightedTotal(components: ScoringComponentScores): number {
  const total =
    components.correctness * SUBMISSION_SCORING_WEIGHTS.correctness +
    components.performance * SUBMISSION_SCORING_WEIGHTS.performance +
    components.sqlUsage * SUBMISSION_SCORING_WEIGHTS.sqlUsage +
    components.clarity * SUBMISSION_SCORING_WEIGHTS.clarity +
    components.recommendations * SUBMISSION_SCORING_WEIGHTS.recommendations;
  return clampScore(total);
}

function resolveStatus(
  errorStatus: SubmissionStatusValue | undefined,
  tests: TestCaseResult[],
  executionTimeMs: number,
  timeLimitMs: number,
  optRatio: number,
): SubmissionStatusValue {
  if (errorStatus) {
    return errorStatus;
  }

  const allPassed = tests.length > 0 && tests.every((t) => t.passed);
  if (!allPassed) {
    return 'WRONG_ANSWER';
  }

  if (executionTimeMs > timeLimitMs * optRatio) {
    return 'OPTIMIZATION_REQUIRED';
  }

  return 'ACCEPTED';
}

export function computeSubmissionScore(
  input: ComputeScoreInput,
  optRatio = parseFloat(process.env.OPTIMIZATION_TIME_RATIO || '0.85'),
): ComputeScoreResult {
  const correctness = input.errorStatus ? 0 : scoreCorrectness(input.tests);
  const performance =
    input.errorStatus === 'TIME_LIMIT_EXCEEDED'
      ? 0
      : scorePerformance(input.executionTimeMs, input.timeLimitMs, optRatio);
  const sqlUsage = scoreSqlUsage(input.query);
  const clarity = scoreClarity(input.query);
  const recommendations = scoreRecommendations();

  const components: ScoringComponentScores = {
    correctness,
    performance,
    sqlUsage,
    clarity,
    recommendations,
  };

  const breakdown: ScoringBreakdown = {
    ...components,
    weightedTotal: weightedTotal(components),
    weights: SUBMISSION_SCORING_WEIGHTS,
  };

  const status = resolveStatus(
    input.errorStatus,
    input.tests,
    input.executionTimeMs,
    input.timeLimitMs,
    optRatio,
  );

  return {
    breakdown,
    status,
    score: breakdown.weightedTotal,
  };
}
