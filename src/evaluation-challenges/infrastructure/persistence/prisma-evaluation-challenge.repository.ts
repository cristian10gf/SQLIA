import { Injectable } from '@nestjs/common';
import { ChallengeVisibility } from '@prisma/client';
import { Challenge } from '../../../challenges/domain/entities/challenge.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { EvaluationChallenge } from '../../domain/entities/evaluation-challenge.entity';
import { IEvaluationChallengeRepository } from '../../domain/repositories/evaluation-challenge.repository.interface';

@Injectable()
export class PrismaEvaluationChallengeRepository implements IEvaluationChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(evaluationChallenge: EvaluationChallenge): Promise<EvaluationChallenge> {
    const savedModel = await this.prisma.evaluationChallenge.create({
      data: {
        evaluationId: evaluationChallenge.evaluationId,
        challengeId: evaluationChallenge.challengeId,
        orderIndex: evaluationChallenge.orderIndex,
        points: evaluationChallenge.points,
      },
      include: {
        challenge: true,
        evaluation: true,
      },
    });

    return this.mapToDomain(savedModel);
  }

  async findByEvaluationAndChallenge(evaluationId: string, challengeId: string): Promise<EvaluationChallenge | null> {
    const model = await this.prisma.evaluationChallenge.findUnique({
      where: {
        evaluationId_challengeId: {
          evaluationId,
          challengeId,
        },
      },
      include: {
        challenge: true,
      },
    });

    return model ? this.mapToDomain(model) : null;
  }

  async findByEvaluation(
    evaluationId: string,
    skip: number,
    take: number,
    visibility?: boolean,
  ): Promise<{ data: Challenge[]; total: number }> {
    const where = {
      evaluationId,
      ...(visibility === undefined
        ? {}
        : { challenge: { visibility: visibility ? ChallengeVisibility.PUBLIC : ChallengeVisibility.PRIVATE } }),
    };

    const [models, total] = await Promise.all([
      this.prisma.evaluationChallenge.findMany({
        where,
        skip,
        take,
        include: {
          challenge: true,
        },
        orderBy: { orderIndex: 'asc' },
      }),
      this.prisma.evaluationChallenge.count({ where }),
    ]);

    return {
      data: models.map((model) => this.mapChallengeToDomain(model.challenge)),
      total,
    };
  }

  async update(
    evaluationId: string,
    challengeId: string,
    data: Partial<EvaluationChallenge>,
  ): Promise<EvaluationChallenge> {
    const updated = await this.prisma.evaluationChallenge.update({
      where: {
        evaluationId_challengeId: {
          evaluationId,
          challengeId,
        },
      },
      data: {
        orderIndex: data.orderIndex,
        points: data.points,
      },
      include: {
        challenge: true,
      },
    });

    return this.mapToDomain(updated);
  }

  async delete(evaluationId: string, challengeId: string): Promise<void> {
    await this.prisma.evaluationChallenge.delete({
      where: {
        evaluationId_challengeId: {
          evaluationId,
          challengeId,
        },
      },
    });
  }

  async deleteByChallenge(challengeId: string): Promise<void> {
    await this.prisma.evaluationChallenge.deleteMany({
      where: { challengeId },
    });
  }

  private mapToDomain(model: any): EvaluationChallenge {
    return new EvaluationChallenge(
      model.evaluationId,
      model.challengeId,
      model.orderIndex,
      model.points,
    );
  }

  private mapChallengeToDomain(model: any): Challenge {
    return new Challenge(
      model.id,
      model.createdBy,
      model.courseId,
      model.title,
      model.description,
      model.difficulty,
      model.visibility,
      model.databaseEngine,
      model.schemaDefinition,
      model.seedScript,
      model.expectedResult ?? {},
      model.timeLimitMs,
      model.status,
      model.createdAt,
    );
  }
}
