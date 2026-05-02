import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChallengeVisibility } from '@prisma/client';
import { Challenge } from '../../domain/entities/challenge.entity';
import { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';

@Injectable()
export class PrismaChallengeRepository implements IChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(challenge: Challenge): Promise<Challenge> {
    const savedModel = await this.prisma.challenge.create({
      data: {
        id: challenge.id,
        createdBy: challenge.createdBy,
        courseId: challenge.courseId,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        visibility: challenge.visibility,
        databaseEngine: challenge.databaseEngine,
        schemaDefinition: challenge.schemaDefinition,
        seedScript: challenge.seedScript,
        expectedResult: challenge.expectedResult,
        timeLimitMs: challenge.timeLimitMs,
        status: challenge.status,
      },
    });

    return this.mapToDomain(savedModel);
  }

  async findById(id: string): Promise<Challenge | null> {
    const model = await this.prisma.challenge.findUnique({
      where: { id },
    });

    return model ? this.mapToDomain(model) : null;
  }

  async findAll(skip: number, take: number): Promise<{ data: Challenge[]; total: number }> {
    const [models, total] = await Promise.all([
      this.prisma.challenge.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challenge.count(),
    ]);

    return {
      data: models.map((model) => this.mapToDomain(model)),
      total,
    };
  }

  async findByCourse(
    courseId: string,
    skip: number,
    take: number,
    visibility?: boolean,
    maskExpectedResult?: boolean,
  ): Promise<{ data: Challenge[]; total: number }> {
    const where = {
      courseId,
      ...(visibility === undefined ? {} : { visibility: visibility ? ChallengeVisibility.PUBLIC : ChallengeVisibility.PRIVATE }),
    };

    const select: any = {
      id: true,
      createdBy: true,
      courseId: true,
      title: true,
      description: true,
      difficulty: true,
      visibility: true,
      databaseEngine: true,
      schemaDefinition: true,
      seedScript: true,
      timeLimitMs: true,
      status: true,
      createdAt: true,
    };

    if (!maskExpectedResult) {
      select.expectedResult = true;
    }

    const [models, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return {
      data: models.map((model) => this.mapToDomain(model)),
      total,
    };
  }

  async findByProfessor(
    professorId: string,
    skip: number,
    take: number,
    visibility?: boolean,
    maskExpectedResult?: boolean,
  ): Promise<{ data: Challenge[]; total: number }> {
    const where = {
      createdBy: professorId,
      ...(visibility === undefined ? {} : { visibility: visibility ? ChallengeVisibility.PUBLIC : ChallengeVisibility.PRIVATE }),
    };

    const select: any = {
      id: true,
      createdBy: true,
      courseId: true,
      title: true,
      description: true,
      difficulty: true,
      visibility: true,
      databaseEngine: true,
      schemaDefinition: true,
      seedScript: true,
      timeLimitMs: true,
      status: true,
      createdAt: true,
    };

    if (!maskExpectedResult) {
      select.expectedResult = true;
    }

    const [models, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return {
      data: models.map((model) => this.mapToDomain(model)),
      total,
    };
  }

  async update(id: string, challenge: Partial<Challenge>): Promise<Challenge> {
    const updated = await this.prisma.challenge.update({
      where: { id },
      data: {
        ...(challenge.courseId ? { courseId: challenge.courseId } : {}),
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        visibility: challenge.visibility,
        databaseEngine: challenge.databaseEngine,
        schemaDefinition: challenge.schemaDefinition,
        seedScript: challenge.seedScript,
        expectedResult: challenge.expectedResult,
        timeLimitMs: challenge.timeLimitMs,
      },
    });

    return this.mapToDomain(updated);
  }

  async updateVisibility(id: string, visibility: ChallengeVisibility): Promise<Challenge> {
    const updated = await this.prisma.challenge.update({
      where: { id },
      data: { visibility },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.challenge.delete({
      where: { id },
    });
  }

  private mapToDomain(model: any): Challenge {
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
