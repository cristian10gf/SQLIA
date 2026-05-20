import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { User } from '../../../auth/domain/entities/user.entity';
import { Role } from '../../../auth/domain/enums/role.enum';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { FindStudentEvaluationScoresUseCase } from '../../application/use-cases/find-student-evaluation-scores.use-case';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly findStudentEvaluationScoresUseCase: FindStudentEvaluationScoresUseCase,
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
}