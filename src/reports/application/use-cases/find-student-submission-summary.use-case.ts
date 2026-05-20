import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REPORT_REPOSITORY } from '../../domain/repositories/report.repository.interface';
import type { IReportRepository } from '../../domain/repositories/report.repository.interface';

@Injectable()
export class FindStudentSubmissionSummaryUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: IReportRepository,
  ) {}

  async execute(
    courseId: string,
    studentId: string,
    requesterUserId: string,
    requesterRole: string,
  ) {
    const courseOwnership = await this.reportRepository.findCourseOwnership(courseId);
    if (!courseOwnership) {
      throw new NotFoundException('El curso no existe');
    }

    const isEnrolled = await this.reportRepository.isStudentEnrolled(courseId, studentId);
    if (!isEnrolled) {
      throw new NotFoundException('El estudiante no está inscrito en este curso');
    }

    return await this.reportRepository.findStudentSubmissionSummaryByCourse(courseId, studentId);
  }
}
