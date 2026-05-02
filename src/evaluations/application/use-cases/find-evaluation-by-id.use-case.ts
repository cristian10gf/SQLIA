import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository.interface';
import type { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { Evaluation } from '../../domain/entities/evaluation.entity';

@Injectable()
export class FindEvaluationByIdUseCase {
  constructor(
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async execute(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(id);

    if (!evaluation) {
      throw new NotFoundException('La evaluacion no existe');
    }

    return evaluation;
  }
}