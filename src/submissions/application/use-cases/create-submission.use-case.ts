import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import type { CreateSubmissionDto } from '../dtos/create-submission.dto';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface';
import { SUBMISSION_ELIGIBILITY_QUERY } from '../../domain/interfaces/submission-eligibility.query.tokens';
import type { ISubmissionEligibilityQuery } from '../../domain/interfaces/submission-eligibility.query.interface';
import { SQL_EVALUATION_ENQUEUE_OPTS } from '../../../shared/infrastructure/queue/bull-job-options.presets';

@Injectable()
export class CreateSubmissionUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
    @Inject(SUBMISSION_ELIGIBILITY_QUERY)
    private readonly eligibility: ISubmissionEligibilityQuery,
    @InjectQueue('sql-evaluation') private readonly sqlQueue: Queue,
  ) {}

  async execute(
    dto: CreateSubmissionDto,
    studentId: string,
  ): Promise<{ submissionId: string; jobId: string | undefined }> {
    const challenge = await this.eligibility.findChallengeForSubmission(
      dto.challengeId,
    );
    if (!challenge) {
      throw new BadRequestException('Reto no encontrado');
    }

    const enrolled = await this.eligibility.isStudentEnrolledInCourse(
      studentId,
      challenge.courseId,
    );
    if (!enrolled) {
      throw new ForbiddenException(
        'Debés estar inscripto en el curso del reto',
      );
    }

    if (challenge.status === 'ARCHIVED') {
      throw new ForbiddenException('El reto está archivado');
    }

    if (dto.evaluationId) {
      const ok = await this.eligibility.existsVisibleEvaluationForChallenge({
        evaluationId: dto.evaluationId,
        challengeId: challenge.id,
        courseId: challenge.courseId,
      });
      if (!ok) {
        throw new BadRequestException(
          'Evaluación inválida o no visible para este reto',
        );
      }
    }

    const sandboxStatus = await this.eligibility.getChallengeSandboxStatus(
      challenge.id,
    );
    if (sandboxStatus !== 'READY') {
      throw new ServiceUnavailableException(
        'El entorno de ejecución del reto aún no está listo. Pedí al profesor que aprovisione el sandbox.',
      );
    }

    const submission = await this.submissions.create({
      id: randomUUID(),
      studentId,
      challengeId: dto.challengeId,
      evaluationId: dto.evaluationId ?? null,
      query: dto.query,
    });

    const job = await this.sqlQueue.add(
      'evaluate-submission',
      { submissionId: submission.id },
      SQL_EVALUATION_ENQUEUE_OPTS,
    );

    return { submissionId: submission.id, jobId: job.id };
  }
}
