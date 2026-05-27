import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubmissionStatusValue } from '../../../submissions/domain/entities/submission.entity';
import type {
  CourseOwnershipReadModel,
  StudentEvaluationScoreReadModel,
} from '../../domain/entities/student-evaluation-score.entity';
import { IReportRepository } from '../../domain/repositories/report.repository.interface';

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCourseOwnership(courseId: string): Promise<CourseOwnershipReadModel | null> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        professorId: true,
      },
    });

    return course ? { id: course.id, professorId: course.professorId } : null;
  }

  async isStudentEnrolled(courseId: string, studentId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
      select: {
        courseId: true,
      },
    });

    return enrollment !== null;
  }

  async findStudentEvaluationScoresByCourse(
    courseId: string,
    studentId: string,
    skip: number,
    take: number,
  ): Promise<{ data: StudentEvaluationScoreReadModel[]; total: number }> {
    const where = {
      studentId,
      evaluationId: {
        not: null,
      },
      evaluation: {
        courseId,
      },
    };

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          evaluation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      total,
      data: submissions.map((submission) => ({
        submissionId: submission.id,
        evaluation: {
          id: submission.evaluation?.id ?? submission.evaluationId ?? '',
          title: submission.evaluation?.title ?? 'Sin evaluacion',
        },
        score: submission.score !== null ? Number(submission.score) : null,
        status: submission.status as SubmissionStatusValue,
        submittedAt: submission.createdAt,
      })),
    };
  }

  async findStudentSubmissionSummaryByCourse(
    courseId: string,
    studentId: string,
  ): Promise<{
    total: number;
    accepted: number;
    avgScore: number | null;
    avgExecutionTimeMs: number | null;
  }> {
    const where = {
      studentId,
      evaluationId: {
        not: null,
      },
      evaluation: {
        courseId,
      },
    };

    const [total, accepted, agg] = await Promise.all([
      this.prisma.submission.count({ where }),
      this.prisma.submission.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.submission.aggregate({ where, _avg: { score: true, executionTimeMs: true } }),
    ]);

    const avgScore = agg._avg.score !== null && agg._avg.score !== undefined ? Number(agg._avg.score) : null;
    const avgExecutionTimeMs = agg._avg.executionTimeMs !== null && agg._avg.executionTimeMs !== undefined ? Number(agg._avg.executionTimeMs) : null;

    return {
      total,
      accepted,
      avgScore,
      avgExecutionTimeMs,
    };
  }
}