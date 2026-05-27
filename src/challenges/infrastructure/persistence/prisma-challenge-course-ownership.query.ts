import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IChallengeCourseOwnershipQuery } from '../../domain/interfaces/challenge-course-ownership.query.interface';

@Injectable()
export class PrismaChallengeCourseOwnershipQuery implements IChallengeCourseOwnershipQuery {
  constructor(private readonly prisma: PrismaService) {}

  async getCourseProfessorIdForChallenge(challengeId: string): Promise<string | null> {
    const row = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { course: { select: { professorId: true } } },
    });
    return row?.course.professorId ?? null;
  }
}
