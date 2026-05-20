import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../dtos/pagination.dto';
import { REPORT_REPOSITORY } from '../../domain/repositories/report.repository.interface';
import type { IReportRepository } from '../../domain/repositories/report.repository.interface';

@Injectable()
export class FindStudentEvaluationScoresUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: IReportRepository,
  ) {}

  async execute(
    courseId: string,
    studentId: string,
    professorId: string,
    pagination?: PaginationDto,
  ) {
    const courseOwnership = await this.reportRepository.findCourseOwnership(courseId);

    if (!courseOwnership) {
      throw new NotFoundException('El curso no existe');
    }

    const isStudentEnrolled = await this.reportRepository.isStudentEnrolled(
      courseId,
      studentId,
    );

    if (!isStudentEnrolled) {
      throw new NotFoundException('El estudiante no está inscrito en este curso');
    }

    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const { data, total } = await this.reportRepository.findStudentEvaluationScoresByCourse(
      courseId,
      studentId,
      skip,
      limit,
    );

    return {
      courseId,
      studentId,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }
}