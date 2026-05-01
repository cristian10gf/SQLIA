import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Course } from '../../domain/entities/course.entity';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';

@Injectable()
export class FindCourseByIdUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new NotFoundException('El curso no existe');
    }

    return course;
  }
}
