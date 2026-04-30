import { Enrollment } from '../entities/enrollment.entity';

export const ENROLLMENT_REPOSITORY = 'ENROLLMENT_REPOSITORY';

export interface IEnrollmentRepository {
  save(enrollment: Enrollment): Promise<Enrollment>;
  findByCompositeId(studentId: string, courseId: string): Promise<Enrollment | null>;
  findByCourse(courseId: string): Promise<Enrollment[]>;
}