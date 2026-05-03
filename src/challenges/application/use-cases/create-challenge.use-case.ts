import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { Challenge } from '../../domain/entities/challenge.entity';
import { CreateChallengeDto } from '../dtos/create-challenge.dto';
import { ChallengeStatus } from '../../domain/enums/challenge-status.enum';
import { SqlRunnerService } from '../../../shared/infrastructure/services/sql-runner.service';

@Injectable()
export class CreateChallengeUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challengeRepository: IChallengeRepository,
    private readonly sqlRunnerService: SqlRunnerService,
  ) {}

  async execute(
    dto: CreateChallengeDto,
    createdBy: string,
  ): Promise<Challenge> {
    //Verificar schema valido
    await this.sqlRunnerService.runValidation(dto.schemaDefinition);

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
      ChallengeStatus.DRAFT,
    );

    return await this.challengeRepository.save(challenge);
  }
}
