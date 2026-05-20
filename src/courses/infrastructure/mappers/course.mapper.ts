import type { Course as PrismaCourse } from '@prisma/client';
import { Course } from '../../domain/entities/course.entity';

export class CourseMapper {
  static toDomain(model: PrismaCourse): Course {
    return new Course(
      model.id,
      model.name,
      model.code,
      model.period,
      model.group ?? '',
      model.professorId,
    );
  }
}
