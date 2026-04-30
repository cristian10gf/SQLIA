import { Course } from '../entities/course.entity';

export const COURSE_REPOSITORY = 'COURSE_REPOSITORY';

export interface ICourseRepository {
  save(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  findById(id: string): Promise<Course | null>;
}