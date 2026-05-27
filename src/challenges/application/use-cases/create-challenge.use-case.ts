import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { Challenge } from '../../domain/entities/challenge.entity';
import { CreateChallengeDto } from '../dtos/create-challenge.dto';
import { ChallengeStatus } from '../../domain/enums/challenge-status.enum';
import { SQL_EXECUTION_PORT } from '../../../shared/domain/interfaces/sql-execution.tokens';
import type { ISqlExecutionPort } from '../../../shared/domain/interfaces/sql-execution.interface';

@Injectable()
export class CreateChallengeUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
    @Inject(SQL_EXECUTION_PORT) private readonly sqlExecution: ISqlExecutionPort,
  ) {}

  async execute(
    dto: CreateChallengeDto,
    createdBy: string,
  ): Promise<Challenge> {
    await this.sqlExecution.validateSchemaSeed(dto.schemaDefinition, dto.seedScript);

    const challenge = new Challenge(
      randomUUID(),
      createdBy,
      dto.courseId,
      dto.title,
      dto.description,
      dto.difficulty,
      dto.visibility,
      dto.databaseEngine ?? 'PostgreSQL',
      dto.schemaDefinition,
      dto.seedScript ?? null,
      dto.expectedResult,
      dto.timeLimitMs ?? 2000,
      dto.tags ?? [],
      ChallengeStatus.DRAFT,
    );

    return await this.challengeRepository.save(challenge);
  }
}
