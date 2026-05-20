import type { Challenge as PrismaChallenge, Prisma } from '@prisma/client';
import { Challenge } from '../../domain/entities/challenge.entity';
import { ChallengeStatus } from '../../domain/enums/challenge-status.enum';
import { ChallengeVisibility as DomainChallengeVisibility } from '../../domain/enums/challenge-visibility.enum';
import { DifficultyLevel } from '../../domain/enums/difficulty-level.enum';

export type ChallengePersistenceRow = Pick<
  PrismaChallenge,
  | 'id'
  | 'createdBy'
  | 'courseId'
  | 'title'
  | 'description'
  | 'difficulty'
  | 'visibility'
  | 'databaseEngine'
  | 'schemaDefinition'
  | 'seedScript'
  | 'timeLimitMs'
  | 'status'
  | 'createdAt'
> & { expectedResult?: Prisma.JsonValue | null };

export class ChallengeMapper {
  static toDomain(model: ChallengePersistenceRow): Challenge {
    return new Challenge(
      model.id,
      model.createdBy,
      model.courseId,
      model.title,
      model.description,
      model.difficulty as DifficultyLevel,
      model.visibility as DomainChallengeVisibility,
      model.databaseEngine,
      model.schemaDefinition,
      model.seedScript,
      (model.expectedResult ?? {}) as Record<string, any>,
      model.timeLimitMs,
      model.status as ChallengeStatus,
      model.createdAt,
    );
  }
}
