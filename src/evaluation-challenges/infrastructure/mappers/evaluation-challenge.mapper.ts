import type { Prisma } from '@prisma/client';
import { EvaluationChallenge } from '../../domain/entities/evaluation-challenge.entity';

export type EvalChallengeWithChallenge = Prisma.EvaluationChallengeGetPayload<{
  include: { challenge: true };
}>;

export type EvalChallengeWithChallengeAndEvaluation = Prisma.EvaluationChallengeGetPayload<{
  include: { challenge: true; evaluation: true };
}>;

export class EvaluationChallengeMapper {
  static toDomain(
    model: EvalChallengeWithChallenge | EvalChallengeWithChallengeAndEvaluation,
  ): EvaluationChallenge {
    return new EvaluationChallenge(
      model.evaluationId,
      model.challengeId,
      model.orderIndex,
      model.points,
    );
  }
}
