import type { Course as PrismaCourse, Enrollment as PrismaEnrollment } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import type { CourseListItemReadModel } from '../../domain/read-models/course-list-item.read-model';
import type { StudentInCourseReadModel } from '../../domain/read-models/student-in-course.read-model';

export type EnrollmentWithStudent = Prisma.EnrollmentGetPayload<{
  include: { student: true };
}>;

export class EnrollmentMapper {
  static toDomain(model: PrismaEnrollment): Enrollment {
    return new Enrollment(model.studentId, model.courseId, model.enrolledAt);
  }

  static toCourseListItem(c: PrismaCourse): CourseListItemReadModel {
    return {
      id: c.id,
      name: c.name,
      code: c.code,
      period: c.period,
      professorId: c.professorId,
    };
  }

  static toStudentInCourse(m: EnrollmentWithStudent): StudentInCourseReadModel {
    return {
      student: {
        id: m.student.id,
        fullName: m.student.fullName,
        email: m.student.email,
      },
      enrolledAt: m.enrolledAt,
    };
  }
}
