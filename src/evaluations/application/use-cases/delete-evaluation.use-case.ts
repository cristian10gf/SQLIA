import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';

@Injectable()
export class DeleteEvaluationUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingEvaluation = await this.evaluationRepository.findById(id);

    if (!existingEvaluation) {
      throw new NotFoundException('La evaluacion no existe');
    }

    await this.evaluationRepository.delete(id);
  }
}