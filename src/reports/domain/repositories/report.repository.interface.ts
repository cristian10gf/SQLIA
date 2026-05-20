import type {
  CourseOwnershipReadModel,
  StudentEvaluationScoreReadModel,
} from '../entities/student-evaluation-score.entity';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';

export interface IReportRepository {
  findCourseOwnership(courseId: string): Promise<CourseOwnershipReadModel | null>;
  isStudentEnrolled(courseId: string, studentId: string): Promise<boolean>;
  findStudentEvaluationScoresByCourse(
    courseId: string,
    studentId: string,
    skip: number,
    take: number,
  ): Promise<{ data: StudentEvaluationScoreReadModel[]; total: number }>;
}