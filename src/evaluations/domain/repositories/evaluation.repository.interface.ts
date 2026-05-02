import { Evaluation } from '../entities/evaluation.entity';

export const EVALUATION_REPOSITORY = 'EVALUATION_REPOSITORY';

export interface IEvaluationRepository {
  save(evaluation: Evaluation): Promise<Evaluation>;
  findById(id: string): Promise<Evaluation | null>;
  findByCourse(courseId: string,skip: number,take: number,visibility?: boolean): Promise<{ data: Evaluation[]; total: number }>;
  update(id: string, evaluation: Partial<Evaluation>): Promise<Evaluation>;
  updateVisibility(id: string, isVisible: boolean): Promise<Evaluation>;
  delete(id: string): Promise<void>;
}