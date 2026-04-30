import { Injectable, Inject } from '@nestjs/common';
import { COURSE_REPOSITORY } from '../../domain/repositories/course.repository.interface';
import type { ICourseRepository } from '../../domain/repositories/course.repository.interface';
import { PaginationDto } from '../../../courses/application/dtos/pagination.dto';

@Injectable()
export class FindAllCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository
  ) {}

  async execute(paginationDto?: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const { data, total } = await this.courseRepository.findAll(skip, limit);

    return {
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      },
      data
    };
  }
}
