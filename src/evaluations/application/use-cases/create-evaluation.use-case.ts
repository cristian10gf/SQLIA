import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { Evaluation } from '../../domain/entities/evaluation.entity';
import { CreateEvaluationDto } from '../dtos/create-evaluation.dto';

@Injectable()
export class CreateEvaluationUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(dto: CreateEvaluationDto, createdBy: string): Promise<Evaluation> {
    const evaluation = new Evaluation(
      randomUUID(),
      dto.courseId,
      createdBy,
      dto.title,
      dto.description ?? null,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.durationMinutes,
      dto.maxAttempts ?? 1,
      false, // por defecto la evaluación no es visible hasta que la active el profesor
    );

    return await this.evaluationRepository.save(evaluation);
  }
}