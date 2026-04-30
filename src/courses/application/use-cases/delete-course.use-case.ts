import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';

@Injectable()
export class DeleteCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingCourse = await this.courseRepository.findById(id);
    if (!existingCourse) {
      throw new NotFoundException('El curso no existe');
    }
    await this.courseRepository.delete(id);
  }
}
