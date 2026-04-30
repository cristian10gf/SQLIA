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

    private mapToDomain(model: any): Enrollment {
        return new Enrollment(
            model.studentId,
            model.courseId,
            model.enrolledAt
        );
    }
}