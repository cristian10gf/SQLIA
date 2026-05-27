import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ICourseProfessorQuery } from '../../domain/interfaces/course-professor.query.interface';

@Injectable()
export class PrismaCourseProfessorQuery implements ICourseProfessorQuery {
  constructor(private readonly prisma: PrismaService) {}

  async getProfessorIdForCourse(courseId: string): Promise<string | null> {
    const row = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { professorId: true },
    });
    return row?.professorId ?? null;
  }
}
