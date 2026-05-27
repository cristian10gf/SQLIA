import { Injectable } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Submission,
  SubmissionStatusValue,
} from '../../domain/entities/submission.entity';
import {
  CreateSubmissionData,
  ISubmissionRepository,
  LeaderboardEntry,
  SubmissionWithStudent,
} from '../../domain/repositories/submission.repository.interface';
import { SubmissionMapper } from '../mappers/submission.mapper';

@Injectable()
export class PrismaSubmissionRepository implements ISubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSubmissionData): Promise<Submission> {
    const row = await this.prisma.submission.create({
      data: {
        id: data.id,
        studentId: data.studentId,
        challengeId: data.challengeId,
        evaluationId: data.evaluationId ?? null,
        query: data.query,
        status: SubmissionStatus.QUEUED,
      },
    });
    return SubmissionMapper.toDomain(row);
  }

  async findById(id: string): Promise<Submission | null> {
    const row = await this.prisma.submission.findUnique({ where: { id } });
    return row ? SubmissionMapper.toDomain(row) : null;
  }

  async findByIdAndStudent(
    id: string,
    studentId: string,
  ): Promise<Submission | null> {
    const row = await this.prisma.submission.findFirst({
      where: { id, studentId },
    });
    return row ? SubmissionMapper.toDomain(row) : null;
  }

  async updateStatus(id: string, status: SubmissionStatusValue): Promise<void> {
    await this.prisma.submission.update({
      where: { id },
      data: { status: status },
    });
  }

  async updateResult(
    id: string,
    data: {
      status: SubmissionStatusValue;
      score: number;
      executionTimeMs: number;
      resultJson: Record<string, any>;
    },
  ): Promise<void> {
    await this.prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        score: data.score,
        executionTimeMs: data.executionTimeMs,
        resultJson: data.resultJson,
      },
    });
  }

  async findStuckRunning(olderThanMs: number): Promise<Submission[]> {
    const threshold = new Date(Date.now() - olderThanMs);
    const rows = await this.prisma.submission.findMany({
      where: {
        status: SubmissionStatus.RUNNING,
        updatedAt: { lt: threshold },
      },
    });
    return rows.map((r) => SubmissionMapper.toDomain(r));
  }

  async claimForProcessing(id: string): Promise<boolean> {
    const result = await this.prisma.submission.updateMany({
      where: { id, status: SubmissionStatus.QUEUED },
      data: { status: SubmissionStatus.RUNNING },
    });
    return result.count > 0;
  }

  async countByStudentAndEvaluation(studentId: string, evaluationId: string): Promise<number> {
    return this.prisma.submission.count({
      where: { studentId, evaluationId },
    });
  }

  async findByEvaluationAndChallenge(
    evaluationId: string,
    challengeId: string,
  ): Promise<SubmissionWithStudent[]> {
    const rows = await this.prisma.submission.findMany({
      where: { evaluationId, challengeId },
      include: { student: { select: { id: true, fullName: true, email: true } } },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.fullName,
      studentEmail: r.student.email,
      challengeId: r.challengeId,
      evaluationId: r.evaluationId,
      query: r.query,
      status: r.status as SubmissionStatusValue,
      score: Number(r.score ?? 0),
      executionTimeMs: r.executionTimeMs,
      resultJson: r.resultJson as Record<string, any> | null,
      createdAt: r.createdAt,
    }));
  }

  async getLeaderboard(evaluationId: string): Promise<LeaderboardEntry[]> {
    const rows = await this.prisma.$queryRaw<any[]>`
      WITH best_per_challenge AS (
        SELECT
          student_id,
          challenge_id,
          MAX(CAST(score AS FLOAT8)) AS best_score
        FROM submissions
        WHERE evaluation_id = ${evaluationId}::uuid
        GROUP BY student_id, challenge_id
      ),
      student_totals AS (
        SELECT
          student_id,
          COALESCE(SUM(best_score), 0)::FLOAT8 AS total_score,
          COUNT(DISTINCT challenge_id)::INT AS challenges_solved
        FROM best_per_challenge
        GROUP BY student_id
      )
      SELECT
        u.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        ROUND(CAST(st.total_score AS NUMERIC), 2)::FLOAT8 AS total_score,
        st.challenges_solved::INT AS challenges_solved,
        (SELECT COUNT(*)::INT FROM submissions s2 WHERE s2.student_id = u.id AND s2.evaluation_id = ${evaluationId}::uuid) AS submission_count
      FROM student_totals st
      JOIN users u ON u.id = st.student_id
      ORDER BY st.total_score DESC, st.challenges_solved DESC
      LIMIT 50
    `;

    return rows.map((r) => ({
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      totalScore: Number(r.total_score),
      challengesSolved: Number(r.challenges_solved),
      submissionCount: Number(r.submission_count),
    }));
  }
}
