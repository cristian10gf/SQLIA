import { Injectable } from '@nestjs/common';
import type {
  ChallengeForSubmissionRow,
  ISubmissionEligibilityQuery,
} from '../../domain/interfaces/submission-eligibility.query.interface';
import type { ChallengeSandboxStatusValue } from '../../../challenges/domain/repositories/challenge-sandbox.repository.interface';
import { ChallengeStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaSubmissionEligibilityQuery implements ISubmissionEligibilityQuery {
  constructor(private readonly prisma: PrismaService) {}

  async findChallengeForSubmission(
    challengeId: string,
  ): Promise<ChallengeForSubmissionRow | null> {
    const row = await this.prisma.challenge.findFirst({
      where: { id: challengeId, status: ChallengeStatus.PUBLISHED },
      select: { id: true, courseId: true, status: true },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      courseId: row.courseId,
      status: row.status,
    };
  }

  async isStudentEnrolledInCourse(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    const row = await this.prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      select: { courseId: true },
    });
    return row !== null;
  }

  async existsVisibleEvaluationForChallenge(params: {
    evaluationId: string;
    challengeId: string;
    courseId: string;
  }): Promise<boolean> {
    const row = await this.prisma.evaluation.findFirst({
      where: {
        id: params.evaluationId,
        courseId: params.courseId,
        isVisible: true,
        challenges: { some: { challengeId: params.challengeId } },
      },
      select: { id: true },
    });
    return row !== null;
  }

  async getChallengeSandboxStatus(
    challengeId: string,
  ): Promise<ChallengeSandboxStatusValue | null> {
    const row = await this.prisma.challengeSandbox.findUnique({
      where: { challengeId },
      select: { status: true },
    });
    if (!row) {
      return null;
    }
    return row.status;
  }
}
