import type { CourseListItemReadModel } from '../read-models/course-list-item.read-model';
import type { StudentInCourseReadModel } from '../read-models/student-in-course.read-model';
import { Enrollment } from '../entities/enrollment.entity';

export const ENROLLMENT_REPOSITORY = 'ENROLLMENT_REPOSITORY';

export interface IEnrollmentRepository {
  save(enrollment: Enrollment): Promise<Enrollment>;
  findByCompositeId(studentId: string, courseId: string): Promise<Enrollment | null>;
  findByCourse(courseId: string): Promise<Enrollment[]>;
  deleteByCompositeId(studentId: string, courseId: string): Promise<void>;
  findStudentsByCourse(
    courseId: string,
    skip: number,
    take: number,
  ): Promise<{ data: StudentInCourseReadModel[]; total: number }>;
  findCoursesByStudent(
    studentId: string,
    skip: number,
    take: number,
  ): Promise<{ data: CourseListItemReadModel[]; total: number }>;
  findCoursesByProfessor(
    professorId: string,
    skip: number,
    take: number,
  ): Promise<{ data: CourseListItemReadModel[]; total: number }>;
}