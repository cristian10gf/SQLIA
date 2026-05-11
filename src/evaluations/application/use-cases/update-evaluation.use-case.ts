import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { Evaluation } from '../../domain/entities/evaluation.entity';
import { UpdateEvaluationDto } from '../dtos/update-evaluation.dto';

@Injectable()
export class UpdateEvaluationUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(id: string, dto: UpdateEvaluationDto): Promise<Evaluation> {
    const existingEvaluation = await this.evaluationRepository.findById(id);

    if (!existingEvaluation) {
      throw new NotFoundException('La evaluación no existe');
    }

    const data: Partial<Evaluation> = {
      courseId: dto.courseId,
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      durationMinutes: dto.durationMinutes,
      maxAttempts: dto.maxAttempts,
    };

    return await this.evaluationRepository.update(id, data);
  }
}