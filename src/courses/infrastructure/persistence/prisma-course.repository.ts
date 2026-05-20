import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Course } from '../../domain/entities/course.entity';
import { ICourseRepository } from '../../domain/repositories/course.repository.interface';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(course: Course): Promise<Course> {
        const savedModel = await this.prisma.course.create({
            data: {
                id: course.id,
                name: course.name,
                code: course.code,
                period: course.period,
                group: course.group,
                professorId: course.professorId,
            },
        });
        return CourseMapper.toDomain(savedModel);
    }

    async findAll(skip: number, take: number): Promise<{ data: Course[], total: number }> {
        const [models, total] = await Promise.all([
            this.prisma.course.findMany({
                skip: skip,
                take: take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.course.count()
        ]);

        const domainCourses = models.map((model) => CourseMapper.toDomain(model));

        return {
            data: domainCourses,
            total: total
        };
    }

    async findById(id: string): Promise<Course | null> {
        const model = await this.prisma.course.findUnique({
            where: { id: id },
        });
        if (!model) {
            return null;
        }
        return CourseMapper.toDomain(model);
    }

    async findByCode(code: string): Promise<Course | null> {
        const model = await this.prisma.course.findUnique({
            where: { code: code },
        });
        return model ? CourseMapper.toDomain(model) : null;
    }

    async update(id: string, course: Partial<Course>): Promise<Course> {
        const updated = await this.prisma.course.update({
            where: { id: id },
            data: {
                name: course.name,
                code: course.code,
                period: course.period,
                group: course.group,
                professorId: course.professorId,
            },
        });
        return CourseMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.course.delete({
            where: { id: id },
        });
    }
}
