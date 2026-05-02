import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { User } from '../../../auth/domain/entities/user.entity';
import { CreateEvaluationDto } from '../../application/dtos/create-evaluation.dto';
import { UpdateEvaluationDto } from '../../application/dtos/update-evaluation.dto';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { ListEvaluationsQueryDto } from '../../application/dtos/list-evaluations-query.dto';
import { ChangeEvaluationVisibilityDto } from '../../application/dtos/change-evaluation-visibility.dto';
import { CreateEvaluationUseCase } from '../../application/use-cases/create-evaluation.use-case';
import { UpdateEvaluationUseCase } from '../../application/use-cases/update-evaluation.use-case';
import { DeleteEvaluationUseCase } from '../../application/use-cases/delete-evaluation.use-case';
import { FindEvaluationByIdUseCase } from '../../application/use-cases/find-evaluation-by-id.use-case';
import { FindEvaluationsByCourseUseCase } from '../../application/use-cases/find-evaluations-by-course.use-case';
import { FindVisibleEvaluationsByCourseUseCase } from '../../application/use-cases/find-visible-evaluations-by-course.use-case';
import { ChangeEvaluationVisibilityUseCase } from '../../application/use-cases/change-evaluation-visibility.use-case';

@ApiTags('Evaluations')
@Controller('evaluations')
export class EvaluationController {
  constructor(
    private readonly createEvaluationUseCase: CreateEvaluationUseCase,
    private readonly updateEvaluationUseCase: UpdateEvaluationUseCase,
    private readonly deleteEvaluationUseCase: DeleteEvaluationUseCase,
    private readonly findEvaluationByIdUseCase: FindEvaluationByIdUseCase,
    private readonly findEvaluationsByCourseUseCase: FindEvaluationsByCourseUseCase,
    private readonly findVisibleEvaluationsByCourseUseCase: FindVisibleEvaluationsByCourseUseCase,
    private readonly changeEvaluationVisibilityUseCase: ChangeEvaluationVisibilityUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ type: CreateEvaluationDto })
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Crear una evaluacion' })
  async create(@Body() dto: CreateEvaluationDto, @CurrentUser() user: User) {
    const evaluation = await this.createEvaluationUseCase.execute(dto, String(user.id));

    return {
      message: 'Evaluacion creada exitosamente',
      data: evaluation,
    };
  }

  @Get('course/:courseId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar evaluaciones de un curso para profesor con filtro de visibilidad y paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'visibility', required: false, enum: ['all', 'visible', 'invisible'], example: 'all' })
  async listForProfessor(@Param('courseId', ParseUUIDPipe) courseId: string, @Query() query: ListEvaluationsQueryDto) {
    return await this.findEvaluationsByCourseUseCase.execute(courseId, query);
  }

  @Get('course/:courseId/visible')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar evaluaciones visibles de un curso para estudiante con paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listVisibleForStudent(@Param('courseId', ParseUUIDPipe) courseId: string, @Query() pagination: PaginationDto) {
    return await this.findVisibleEvaluationsByCourseUseCase.execute(courseId, pagination);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Obtener una evaluacion por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.findEvaluationByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Editar una evaluacion' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEvaluationDto) {
    const evaluation = await this.updateEvaluationUseCase.execute(id, dto);

    return {
      message: 'Evaluacion actualizada exitosamente',
      data: evaluation,
    };
  }

  @Patch(':id/change-visibility')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Cambiar la visibilidad de una evaluacion' })
  async changeVisibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeEvaluationVisibilityDto) {
    const evaluation = await this.changeEvaluationVisibilityUseCase.execute(id, dto.isVisible);

    return {
      message: 'Visibilidad de la evaluacion actualizada exitosamente',
      data: evaluation,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Eliminar una evaluacion' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteEvaluationUseCase.execute(id);
    return { message: 'Evaluacion eliminada exitosamente' };
  }

}