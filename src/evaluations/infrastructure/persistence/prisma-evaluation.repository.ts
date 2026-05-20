import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Evaluation } from '../../domain/entities/evaluation.entity';
import { IEvaluationRepository } from '../../domain/repositories/evaluation.repository.interface';
import { EvaluationMapper } from '../mappers/evaluation.mapper';

@Injectable()
export class PrismaEvaluationRepository implements IEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(evaluation: Evaluation): Promise<Evaluation> {
    const savedModel = await this.prisma.evaluation.create({
      data: {
        id: evaluation.id,
        courseId: evaluation.courseId,
        createdBy: evaluation.createdBy,
        title: evaluation.title,
        description: evaluation.description,
        startDate: evaluation.startDate,
        endDate: evaluation.endDate,
        durationMinutes: evaluation.durationMinutes,
        maxAttempts: evaluation.maxAttempts,
        isVisible: evaluation.isVisible,
      },
    });

    return EvaluationMapper.toDomain(savedModel);
  }

  async findById(id: string): Promise<Evaluation | null> {
    const model = await this.prisma.evaluation.findUnique({
      where: { id },
    });

    return model ? EvaluationMapper.toDomain(model) : null;
  }

  async findByCourse(courseId: string,skip: number,take: number,visibility?: boolean): Promise<{ data: Evaluation[]; total: number }> {
    const where = {
      courseId,
      ...(visibility === undefined ? {} : { isVisible: visibility }),
    };

    const [models, total] = await Promise.all([
      this.prisma.evaluation.findMany({
        where,
        skip,
        take
      }), //orderBy: { createdAt: 'desc' }, hay que crear el campo en la tabla createdAt
      this.prisma.evaluation.count({ where }),
    ]);

    return {
      data: models.map((model) => EvaluationMapper.toDomain(model)),
      total,
    };
  }

  async update(id: string, evaluation: Partial<Evaluation>): Promise<Evaluation> {
    const updated = await this.prisma.evaluation.update({
      where: { id },
      data: {
        courseId: evaluation.courseId,
        title: evaluation.title,
        description: evaluation.description,
        startDate: evaluation.startDate,
        endDate: evaluation.endDate,
        durationMinutes: evaluation.durationMinutes,
        maxAttempts: evaluation.maxAttempts,
      },
    });

    return EvaluationMapper.toDomain(updated);
  }

  async updateVisibility(id: string, isVisible: boolean): Promise<Evaluation> {
    const updated = await this.prisma.evaluation.update({
      where: { id },
      data: { isVisible },
    });

    return EvaluationMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.evaluation.delete({
      where: { id },
    });
  }
}
