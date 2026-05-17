import type { Evaluation as PrismaEvaluation } from '@prisma/client';
import { Evaluation } from '../../domain/entities/evaluation.entity';

export class EvaluationMapper {
  static toDomain(model: PrismaEvaluation): Evaluation {
    return new Evaluation(
      model.id,
      model.courseId,
      model.createdBy,
      model.title,
      model.description,
      model.startDate,
      model.endDate,
      model.durationMinutes,
      model.maxAttempts,
      model.isVisible,
      undefined,
    );
  }
}
