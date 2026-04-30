import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  ConflictException,
  UnauthorizedException,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateEnrollmentUseCase } from '../../application/use-cases/create-enrollment.use-case';
import { CreateEnrollmentDto } from '../../application/dtos/create-enrollment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DeleteEnrollmentUseCase } from '../../application/use-cases/delete-enrollment.use-case';
import { FindStudentsByCourseUseCase } from '../../application/use-cases/find-students-by-course.use-case';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { FindCoursesByStudentUseCase } from '../../application/use-cases/find-courses-by-student.use-case';
import { FindCoursesByProfessorUseCase } from '../../application/use-cases/find-courses-by-professor.use-case';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
    private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    private readonly findStudentsByCourseUseCase: FindStudentsByCourseUseCase,
    private readonly findCoursesByStudentUseCase: FindCoursesByStudentUseCase,
    private readonly findCoursesByProfessorUseCase: FindCoursesByProfessorUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Inscribir a un estudiante en un curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiResponse({ type: CreateEnrollmentDto })
  async enroll(@Body() dto: CreateEnrollmentDto) {
    const result = await this.createEnrollmentUseCase.execute(dto);
    return {
      message: 'Inscripcion realizada con exito',
      data: result,
    };
  }

  @Delete(':courseId/students/:studentId')
  @ApiOperation({ summary: 'Eliminar inscripción de un estudiante en un curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async remove(@Param('studentId') studentId: string, @Param('courseId') courseId: string) {
    await this.deleteEnrollmentUseCase.execute(studentId, courseId);
    return { message: 'Inscripcion eliminada exitosamente' };
  }

  @Get('course/:courseId/students')
  @ApiOperation({ summary: 'Listar estudiantes de un curso con paginacion' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async studentsByCourse(@Param('courseId') courseId: string, @Query() pagination: PaginationDto) {
    return await this.findStudentsByCourseUseCase.execute(courseId, pagination);
  }

  @Get('student/:studentId/courses')
  @ApiOperation({ summary: 'Listar cursos en los que está inscrito un estudiante con paginacion' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async coursesByStudent(@Param('studentId') studentId: string, @Query() pagination: PaginationDto) {
    return await this.findCoursesByStudentUseCase.execute(studentId, pagination);
  }

  @Get('professor/:professorId/courses')
  @ApiOperation({ summary: 'Listar cursos asignados a un profesor con paginacion' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async coursesByProfessor(@Param('professorId') professorId: string, @Query() pagination: PaginationDto) {
    return await this.findCoursesByProfessorUseCase.execute(professorId, pagination);
  }
}