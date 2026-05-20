import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import type { CourseListItemReadModel } from '../../domain/read-models/course-list-item.read-model';
import type { StudentInCourseReadModel } from '../../domain/read-models/student-in-course.read-model';
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { EnrollmentMapper, EnrollmentWithStudent } from '../mappers/enrollment.mapper';

@Injectable()
export class PrismaEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(enrollment: Enrollment): Promise<Enrollment> {
    const model = await this.prisma.enrollment.create({
      data: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt,
      },
    });
    return EnrollmentMapper.toDomain(model);
  }

  async bulkCreateForCourse(
    courseId: string,
    studentIds: string[],
  ): Promise<{ created: number; alreadyEnrolled: number }> {
    if (studentIds.length === 0) {
      return { created: 0, alreadyEnrolled: 0 };
    }

    const alreadyEnrolled = await this.findEnrolledStudentIdsInCourse(
      courseId,
      studentIds,
    );
    const alreadySet = new Set(alreadyEnrolled);
    const toCreate = studentIds.filter((id) => !alreadySet.has(id));

    if (toCreate.length === 0) {
      return { created: 0, alreadyEnrolled: alreadyEnrolled.length };
    }

    const result = await this.prisma.enrollment.createMany({
      data: toCreate.map((studentId) => ({
        courseId,
        studentId,
      })),
      skipDuplicates: true,
    });

    return {
      created: result.count,
      alreadyEnrolled: alreadyEnrolled.length,
    };
  }

  async findEnrolledStudentIdsInCourse(
    courseId: string,
    studentIds: string[],
  ): Promise<string[]> {
    if (studentIds.length === 0) return [];

    const rows = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    });

    return rows.map((row) => row.studentId);
  }

  async findByCompositeId(studentId: string, courseId: string): Promise<Enrollment | null> {
    const model = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: studentId,
        },
      },
    });

    if (!model) return null;
    return EnrollmentMapper.toDomain(model);
  }

  async findByCourse(courseId: string): Promise<Enrollment[]> {
    const models = await this.prisma.enrollment.findMany({
      where: { courseId: courseId },
    });
    return models.map((model) => EnrollmentMapper.toDomain(model));
  }

  async deleteByCompositeId(studentId: string, courseId: string): Promise<void> {
    await this.prisma.enrollment.delete({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: studentId,
        },
      },
    });
  }

  async findStudentsByCourse(
    courseId: string,
    skip: number,
    take: number,
  ): Promise<{ data: StudentInCourseReadModel[]; total: number }> {
    const [models, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId: courseId },
        include: { student: true },
        skip,
        take,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId: courseId } }),
    ]);

    const data = models.map((m: EnrollmentWithStudent) => EnrollmentMapper.toStudentInCourse(m));
    return { data, total };
  }

  async findCoursesByStudent(
    studentId: string,
    skip: number,
    take: number,
  ): Promise<{ data: CourseListItemReadModel[]; total: number }> {
    const [models, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { enrollments: { some: { studentId } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: { enrollments: { some: { studentId } } } }),
    ]);

    const data = models.map((c) => EnrollmentMapper.toCourseListItem(c));
    return { data, total };
  }

  async findCoursesByStudentAndProfessor(
    studentId: string,
    professorId: string,
    skip: number,
    take: number,
  ): Promise<{ data: CourseListItemReadModel[]; total: number }> {
    const where = {
      professorId,
      enrollments: { some: { studentId } },
    };

    const [models, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    const data = models.map((c) => EnrollmentMapper.toCourseListItem(c));
    return { data, total };
  }

  async findCoursesByProfessor(
    professorId: string,
    skip: number,
    take: number,
  ): Promise<{ data: CourseListItemReadModel[]; total: number }> {
    const [models, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { professorId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: { professorId } }),
    ]);

    const data = models.map((c) => EnrollmentMapper.toCourseListItem(c));
    return { data, total };
  }
}
