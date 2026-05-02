import { EvaluationChallenge } from '../entities/evaluation-challenge.entity';
import { Challenge } from '../../../challenges/domain/entities/challenge.entity';

export const EVALUATION_CHALLENGE_REPOSITORY = 'EVALUATION_CHALLENGE_REPOSITORY';

export interface IEvaluationChallengeRepository {
    save(evaluationChallenge: EvaluationChallenge): Promise<EvaluationChallenge>;
    findByEvaluationAndChallenge(evaluationId: string, challengeId: string): Promise<EvaluationChallenge | null>;
    findByEvaluation(
        evaluationId: string,
        skip: number,
        take: number,
        visibility?: boolean,
    ): Promise<{ data: Challenge[]; total: number }>;
    update(evaluationId: string, challengeId: string, data: Partial<EvaluationChallenge>): Promise<EvaluationChallenge>;
    delete(evaluationId: string, challengeId: string): Promise<void>;
    deleteByChallenge(challengeId: string): Promise<void>;
}
