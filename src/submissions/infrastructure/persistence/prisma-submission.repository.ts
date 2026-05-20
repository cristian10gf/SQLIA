import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Submission,
  SubmissionStatusValue,
} from '../../domain/entities/submission.entity';
import {
  CreateSubmissionData,
  ISubmissionRepository,
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
}
