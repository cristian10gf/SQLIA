import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Course } from '../../domain/entities/course.entity';
import { ICourseRepository } from '../../domain/repositories/course.repository.interface';

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
        return this.mapToDomain(savedModel);
    }

    async findAll(): Promise<Course[]> {
        const models = await this.prisma.course.findMany();
        return models.map((model) => this.mapToDomain(model));
    }

    async findById(id: string): Promise<Course | null> {
        const model = await this.prisma.course.findUnique({
            where: { id: id },
        });
        if (!model) {
            return null;
        }
        return this.mapToDomain(model);
    }

    async findByCode(code: string): Promise<Course | null> {
        const model = await this.prisma.course.findUnique({
            where: { code: code },
        });
        return model ? this.mapToDomain(model) : null;
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
        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.course.delete({
            where: { id: id },
        });
    }

    private mapToDomain(model: any): Course {
        return new Course(
            model.id,
            model.name,
            model.code,
            model.period,
            model.group,
            model.professorId
        );
    }
}