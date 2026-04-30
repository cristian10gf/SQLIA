import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Course } from '../../domain/entities/course.entity';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';
import { CreateCourseDto } from '../dtos/create-course.dto';

@Injectable()
export class CreateCourseUseCase {
    constructor(
        @Inject(COURSE_REPOSITORY)
        private readonly courseRepository: ICourseRepository
    ) { }

    async execute(dto: CreateCourseDto): Promise<Course> {
        const newId = uuidv4();
        const newCourse = new Course(
            newId,
            dto.name,
            dto.code,
            dto.period,
            dto.group,
            dto.professorId
        );
        return await this.courseRepository.save(newCourse);
    }
}