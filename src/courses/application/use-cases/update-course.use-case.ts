import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';
import { Course } from '../../domain/entities/course.entity';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository
  ) {}

  async execute(id: string, data: any): Promise<Course> {
    const existingCourse = await this.courseRepository.findById(id);
    if (!existingCourse) {
      throw new NotFoundException('El curso no existe');
    }

    if (data.code && data.code !== existingCourse.code) {
      const courseWithSameCode = await this.courseRepository.findByCode(data.code);
      if (courseWithSameCode) {
        throw new ConflictException('Ya existe otro curso con ese código');
      }
    }

    return await this.courseRepository.update(id, data);
  }
}