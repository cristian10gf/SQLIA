import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../auth/domain/enums/role.enum';
import { EnrollmentCourseNotFoundError } from '../../domain/errors/enrollment-course-not-found.error';
import { EnrollmentForbiddenError } from '../../domain/errors/enrollment-forbidden.error';
import type { ICourseProfessorQuery } from '../../domain/interfaces/course-professor.query.interface';
import type { IEnrollmentCsvParser } from '../../domain/interfaces/enrollment-csv-parser.interface';
import type { IStudentEmailLookupQuery } from '../../domain/interfaces/student-email-lookup.query.interface';
import {
  COURSE_PROFESSOR_QUERY,
  ENROLLMENT_CSV_PARSER,
  STUDENT_EMAIL_LOOKUP_QUERY,
} from '../../domain/interfaces/enrollment-bulk.tokens';
import type { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.interface';
import { ENROLLMENT_REPOSITORY } from '../../domain/repositories/enrollment.repository.interface';
import { BulkEnrollResultDto } from '../dtos/bulk-enroll-result.dto';

@Injectable()
export class BulkEnrollFromCsvUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject(COURSE_PROFESSOR_QUERY)
    private readonly courseProfessorQuery: ICourseProfessorQuery,
    @Inject(STUDENT_EMAIL_LOOKUP_QUERY)
    private readonly studentEmailLookup: IStudentEmailLookupQuery,
    @Inject(ENROLLMENT_CSV_PARSER)
    private readonly csvParser: IEnrollmentCsvParser,
  ) {}

  async execute(
    courseId: string,
    csvContent: string,
    requesterUserId: string,
    requesterRole: string,
  ): Promise<BulkEnrollResultDto> {
    await this.assertCourseAccess(courseId, requesterUserId, requesterRole);

    const rawEmails = this.csvParser.extractEmails(csvContent);
    const totalRowsInCsv = rawEmails.length;
    const displayEmailByNormalized = new Map<string, string>();
    for (const raw of rawEmails) {
      const trimmed = raw.trim();
      const normalized = trimmed.toLowerCase();
      if (!displayEmailByNormalized.has(normalized)) {
        displayEmailByNormalized.set(normalized, trimmed);
      }
    }
    const uniqueEmails = [...displayEmailByNormalized.keys()];
    const duplicateEmailsInCsv = totalRowsInCsv - uniqueEmails.length;

    const users = await this.studentEmailLookup.findByEmails(uniqueEmails);
    const usersByEmail = new Map(
      users.map((user) => [user.email.trim().toLowerCase(), user]),
    );

    const notFoundEmails: string[] = [];
    const notStudentEmails: string[] = [];
    const studentIdsToEnroll: string[] = [];

    for (const email of uniqueEmails) {
      const displayEmail = displayEmailByNormalized.get(email) ?? email;
      const user = usersByEmail.get(email);
      if (!user) {
        notFoundEmails.push(displayEmail);
        continue;
      }
      if (user.role !== Role.STUDENT) {
        notStudentEmails.push(displayEmail);
        continue;
      }
      studentIdsToEnroll.push(user.id);
    }

    const { created, alreadyEnrolled } =
      await this.enrollmentRepository.bulkCreateForCourse(
        courseId,
        studentIdsToEnroll,
      );

    return {
      totalRowsInCsv,
      uniqueEmailsInCsv: uniqueEmails.length,
      enrolled: created,
      alreadyEnrolled,
      notFound: notFoundEmails.length,
      notStudentRole: notStudentEmails.length,
      duplicateEmailsInCsv,
      notFoundEmails,
      notStudentEmails,
    };
  }

  private async assertCourseAccess(
    courseId: string,
    requesterUserId: string,
    requesterRole: string,
  ): Promise<void> {
    const professorId =
      await this.courseProfessorQuery.getProfessorIdForCourse(courseId);
    if (!professorId) {
      throw new EnrollmentCourseNotFoundError();
    }
    if (requesterRole !== Role.ADMIN && professorId !== requesterUserId) {
      throw new EnrollmentForbiddenError(
        'Solo el profesor asignado a este curso puede cargar inscripciones',
      );
    }
  }
}
