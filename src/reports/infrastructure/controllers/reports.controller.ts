import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { User } from '../../../auth/domain/entities/user.entity';
import { Role } from '../../../auth/domain/enums/role.enum';
import { FindStudentSubmissionSummaryUseCase } from '../../application/use-cases/find-student-submission-summary.use-case';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { FindStudentEvaluationScoresUseCase } from '../../application/use-cases/find-student-evaluation-scores.use-case';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly findStudentEvaluationScoresUseCase: FindStudentEvaluationScoresUseCase,
    private readonly findStudentSubmissionSummaryUseCase: FindStudentSubmissionSummaryUseCase,
  ) {}

  @Get('courses/:courseId/students/:studentId/submissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({
    summary: 'Obtener las submissions con score de un estudiante en un curso (solo profesores)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findStudentSubmissionsByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.findStudentEvaluationScoresUseCase.execute(
      courseId,
      studentId,
      String(user.id),
      pagination,
    );

    return {
      message: 'ok',
      data: result,
    };
  }

  @Get('courses/:courseId/students/:studentId/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.STUDENT)
  @ApiOperation({ summary: 'Resumen de envios de un estudiante en un curso' })
  async studentSubmissionSummary(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: User,
  ) {
    const summary = await this.findStudentSubmissionSummaryUseCase.execute(
      courseId,
      studentId,
      String(user.id),
      String(user.role),
    );

    return {
      message: 'ok',
      data: summary,
    };
  }
}