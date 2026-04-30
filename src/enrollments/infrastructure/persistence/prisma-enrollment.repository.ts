import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';

@Injectable()
export class PrismaEnrollmentRepository implements IEnrollmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(enrollment: Enrollment): Promise<Enrollment> {
        const model = await this.prisma.enrollment.create({
            data: {
                studentId: enrollment.studentId,
                courseId: enrollment.courseId,
                enrolledAt: enrollment.enrolledAt,
            },
        });
        return this.mapToDomain(model);
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
        return this.mapToDomain(model);
    }

    async findByCourse(courseId: string): Promise<Enrollment[]> {
        const models = await this.prisma.enrollment.findMany({
            where: { courseId: courseId },
        });
        return models.map((model) => this.mapToDomain(model));
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

    async findStudentsByCourse(courseId: string, skip: number, take: number): Promise<{ data: any[]; total: number }> {
        const [models, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where: { courseId: courseId },
                include: { student: true },
                skip,
                take,
                orderBy: { enrolledAt: 'desc' }
            }),
            this.prisma.enrollment.count({ where: { courseId: courseId } })
        ]);

        const data = models.map(m => ({ student: { id: m.student.id, fullName: m.student.fullName, email: m.student.email }, enrolledAt: m.enrolledAt }));
        return { data, total };
    }

    async findCoursesByStudent(studentId: string, skip: number, take: number): Promise<{ data: any[]; total: number }> {
        const [models, total] = await Promise.all([
            this.prisma.course.findMany({
                where: { enrollments: { some: { studentId } } },
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.course.count({ where: { enrollments: { some: { studentId } } } })
        ]);

        const data = models.map(c => ({ id: c.id, name: c.name, code: c.code, period: c.period, professorId: c.professorId }));
        return { data, total };
    }

    async findCoursesByProfessor(professorId: string, skip: number, take: number): Promise<{ data: any[]; total: number }> {
        const [models, total] = await Promise.all([
            this.prisma.course.findMany({
                where: { professorId },
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.course.count({ where: { professorId } })
        ]);

        const data = models.map(c => ({ id: c.id, name: c.name, code: c.code, period: c.period, professorId: c.professorId }));
        return { data, total };
    }

    private mapToDomain(model: any): Enrollment {
        return new Enrollment(
            model.studentId,
            model.courseId,
            model.enrolledAt
        );
    }
}