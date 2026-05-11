import { ChallengeStatus } from '../enums/challenge-status.enum';
import { ChallengeVisibility } from '../enums/challenge-visibility.enum';
import { DifficultyLevel } from '../enums/difficulty-level.enum';

export class Challenge {
  constructor(
    public readonly id: string,
    public readonly createdBy: string,
    public readonly courseId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly difficulty: DifficultyLevel,
    public readonly visibility: ChallengeVisibility,
    public readonly databaseEngine: string,
    public readonly schemaDefinition: string,
    public readonly seedScript: string | null,
    public readonly expectedResult: Record<string, any>,
    public readonly timeLimitMs: number,
    public readonly status: ChallengeStatus,
    public readonly createdAt?: Date,
  ) {}
}
