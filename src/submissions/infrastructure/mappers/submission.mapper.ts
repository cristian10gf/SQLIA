import type { Submission as PrismaSubmission } from '@prisma/client';
import {
  Submission,
  SubmissionStatusValue,
} from '../../domain/entities/submission.entity';

export class SubmissionMapper {
  static toDomain(row: PrismaSubmission): Submission {
    return new Submission(
      row.id,
      row.studentId,
      row.challengeId,
      row.evaluationId,
      row.query,
      row.status as SubmissionStatusValue,
      row.executionTimeMs,
      row.score !== null ? Number(row.score) : null,
      row.resultJson as Record<string, any> | null,
      row.createdAt,
      row.updatedAt,
    );
  }
}
