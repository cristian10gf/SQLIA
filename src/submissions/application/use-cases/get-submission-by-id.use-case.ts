import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Submission } from '../../domain/entities/submission.entity';
import { SUBMISSION_REPOSITORY } from '../../domain/repositories/submission.repository.interface';
import type { ISubmissionRepository } from '../../domain/repositories/submission.repository.interface';
import { CHALLENGE_COURSE_OWNERSHIP_QUERY } from '../../../challenges/domain/interfaces/challenge-provisioning.tokens';
import type { IChallengeCourseOwnershipQuery } from '../../../challenges/domain/interfaces/challenge-course-ownership.query.interface';

@Injectable()
export class GetSubmissionByIdUseCase {
  constructor(
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: ISubmissionRepository,
    @Inject(CHALLENGE_COURSE_OWNERSHIP_QUERY)
    private readonly courseOwnership: IChallengeCourseOwnershipQuery,
  ) {}

  async execute(id: string, requesterUserId: string, requesterRole: string) {
    const submission = await this.submissions.findById(id);
    if (!submission) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (submission.studentId === requesterUserId) {
      return this.toDto(submission);
    }
    if (requesterRole === 'ADMIN') {
      return this.toDto(submission);
    }
    if (requesterRole === 'PROFESSOR') {
      const professorId =
        await this.courseOwnership.getCourseProfessorIdForChallenge(
          submission.challengeId,
        );
      if (!professorId) {
        throw new NotFoundException('Entrega no encontrada');
      }
      if (professorId !== requesterUserId) {
        throw new ForbiddenException('No tenés permiso para ver esta entrega');
      }
      return this.toDto(submission);
    }

    throw new ForbiddenException('No tenés permiso para ver esta entrega');
  }

  private toDto(submission: Submission) {
    return {
      id: submission.id,
      challengeId: submission.challengeId,
      evaluationId: submission.evaluationId,
      status: submission.status,
      executionTimeMs: submission.executionTimeMs,
      score: submission.score,
      resultJson: submission.resultJson,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }
}
