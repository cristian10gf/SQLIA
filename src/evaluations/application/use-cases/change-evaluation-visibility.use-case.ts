import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { Evaluation } from '../../domain/entities/evaluation.entity';

@Injectable()
export class ChangeEvaluationVisibilityUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(id: string, isVisible: boolean): Promise<Evaluation> {
    const existingEvaluation = await this.evaluationRepository.findById(id);

    if (!existingEvaluation) {
      throw new NotFoundException('La evaluación no existe');
    }

    return await this.evaluationRepository.updateVisibility(id, isVisible);
  }
}