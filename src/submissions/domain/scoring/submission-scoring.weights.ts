/** Pesos según PDF lab p.8 — Criterios de evaluación sugeridos. */
export const SUBMISSION_SCORING_WEIGHTS = {
  correctness: 0.6,
  performance: 0.15,
  sqlUsage: 0.1,
  clarity: 0.05,
  recommendations: 0.1,
} as const;

export type ScoringComponentKey = keyof typeof SUBMISSION_SCORING_WEIGHTS;

export interface ScoringComponentScores {
  correctness: number;
  performance: number;
  sqlUsage: number;
  clarity: number;
  recommendations: number;
}

export interface ScoringBreakdown extends ScoringComponentScores {
  weightedTotal: number;
  weights: typeof SUBMISSION_SCORING_WEIGHTS;
}
