import { Course } from '../entities/course.entity';

export const COURSE_REPOSITORY = 'COURSE_REPOSITORY';

export interface ICourseRepository {
  save(course: Course): Promise<Course>;
  findAll(skip: number, take: number): Promise<{ data: Course[], total: number }>;
  findById(id: string): Promise<Course | null>;
  findByCode(code: string): Promise<Course | null>;
  update(id: string, course: Partial<Course>): Promise<Course>; 
  delete(id: string): Promise<void>; 
}