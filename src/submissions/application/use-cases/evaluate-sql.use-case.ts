import { Injectable, Inject } from '@nestjs/common';
import type { IAiProvider } from '../../domain/interfaces/ai-provider.interface';

/** @deprecated El flujo real usa SqlEvaluationService + SqlWorker. Conservado para compatibilidad. */
@Injectable()
export class EvaluateSqlUseCase {
  constructor(
    @Inject('IAiProvider') private readonly aiProvider: IAiProvider,
  ) {}

  execute(data: { submissionId: string }) {
    return Promise.resolve({ submissionId: data.submissionId });
  }
}
