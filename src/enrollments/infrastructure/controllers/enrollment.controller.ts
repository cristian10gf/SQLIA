import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  getSchemaPath,
} from '@nestjs/swagger';
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
import { BulkEnrollFromCsvUseCase } from '../../application/use-cases/bulk-enroll-from-csv.use-case';
import { BulkEnrollResultDto } from '../../application/dtos/bulk-enroll-result.dto';
import { BulkEnrollCsvUploadDto } from '../../application/dtos/bulk-enroll-csv-upload.dto';
import { BrightspaceEnrollmentCsvRowDto } from '../../application/dtos/brightspace-enrollment-csv-row.dto';
import { mapEnrollmentDomainErrorToHttp } from '../mappers/enrollment-domain-error.mapper';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../auth/domain/entities/user.entity';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
    private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    private readonly findStudentsByCourseUseCase: FindStudentsByCourseUseCase,
    private readonly findCoursesByStudentUseCase: FindCoursesByStudentUseCase,
    private readonly findCoursesByProfessorUseCase: FindCoursesByProfessorUseCase,
    private readonly bulkEnrollFromCsvUseCase: BulkEnrollFromCsvUseCase,
  ) {}

  @Post('course/:courseId/bulk-csv')
  @ApiExtraModels(BulkEnrollCsvUploadDto, BrightspaceEnrollmentCsvRowDto, BulkEnrollResultDto)
  @ApiOperation({
    summary: 'Inscripción masiva desde CSV Brightspace (All Groups). Profesor del curso o admin.',
    description: 'Sube un CSV exportado en Brightspace desde **Groups → categoría de grupos → Export → All Groups**.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BulkEnrollCsvUploadDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'Resumen de la carga masiva',
    schema: {
      properties: {
        message: { type: 'string', example: 'Carga masiva de inscripciones procesada' },
        data: { $ref: getSchemaPath(BulkEnrollResultDto) },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'CSV vacío, sin encabezado, sin columna Email Address, sin correos o archivo no enviado',
  })
  @ApiForbiddenResponse({
    description: 'Usuario sin rol adecuado o profesor no asignado al curso',
  })
  @ApiNotFoundResponse({ description: 'Curso inexistente' })
  async bulkEnrollFromCsv(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @CurrentUser() user: User,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debe enviar un archivo CSV en el campo "file"');
    }

    try {
      const csvContent = file.buffer.toString('utf-8');
      const result = await this.bulkEnrollFromCsvUseCase.execute(
        courseId,
        csvContent,
        user.id,
        user.role,
      );

      return {
        message: 'Carga masiva de inscripciones procesada',
        data: result,
      };
    } catch (error) {
      mapEnrollmentDomainErrorToHttp(error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Inscribir a un estudiante en un curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiResponse({ type: CreateEnrollmentDto })
  async enroll(@Body() dto: CreateEnrollmentDto) {
    try {
      const result = await this.createEnrollmentUseCase.execute(dto);
      return {
        message: 'Inscripcion realizada con exito',
        data: result,
      };
    } catch (error) {
      mapEnrollmentDomainErrorToHttp(error);
    }
  }

  @Delete(':courseId/students/:studentId')
  @ApiOperation({
    summary: 'Eliminar inscripción de un estudiante en un curso',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  async remove(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    try {
      await this.deleteEnrollmentUseCase.execute(studentId, courseId);
      return { message: 'Inscripcion eliminada exitosamente' };
    } catch (error) {
      mapEnrollmentDomainErrorToHttp(error);
    }
  }

  @Get('course/:courseId/students')
  @ApiOperation({ summary: 'Listar estudiantes de un curso con paginacion' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async studentsByCourse(
    @Param('courseId') courseId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.findStudentsByCourseUseCase.execute(courseId, pagination);
  }

  @Get('student/:studentId/courses')
  @ApiOperation({
    summary:
      'Listar cursos de un estudiante (paginado). Admin: todos; estudiante: solo propios; profesor: intersección con sus cursos.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.STUDENT)
  @ApiForbiddenResponse({
    description:
      'Estudiante consultando otro id, o rol sin permiso',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async coursesByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.findCoursesByStudentUseCase.execute(
        studentId,
        user.id,
        user.role,
        pagination,
      );
    } catch (error) {
      mapEnrollmentDomainErrorToHttp(error);
    }
  }

  @Get('professor/:professorId/courses')
  @ApiOperation({
    summary: 'Listar cursos asignados a un profesor con paginacion',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async coursesByProfessor(
    @Param('professorId') professorId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.findCoursesByProfessorUseCase.execute(
      professorId,
      pagination,
    );
  }
}
