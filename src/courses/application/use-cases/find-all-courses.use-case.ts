import { Injectable, Inject } from '@nestjs/common';
import { Course } from '../../domain/entities/course.entity';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';

@Injectable()
export class FindAllCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(): Promise<Course[]> {
    return await this.courseRepository.findAll();
  }
}
