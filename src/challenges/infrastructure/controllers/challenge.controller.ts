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
import { CreateChallengeDto } from '../../application/dtos/create-challenge.dto';
import { UpdateChallengeDto } from '../../application/dtos/update-challenge.dto';
import { ChangeChallengeVisibilityDto } from '../../application/dtos/change-challenge-visibility.dto';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { ListChallengesQueryDto } from '../../application/dtos/list-challenges-query.dto';
import { CreateChallengeUseCase } from '../../application/use-cases/create-challenge.use-case';
import { UpdateChallengeUseCase } from '../../application/use-cases/update-challenge.use-case';
import { DeleteChallengeUseCase } from '../../application/use-cases/delete-challenge.use-case';
import { FindChallengeByIdUseCase } from '../../application/use-cases/find-challenge-by-id.use-case';
import { ChangeChallengeVisibilityUseCase } from '../../application/use-cases/change-challenge-visibility.use-case';
import { FindChallengesByCourseUseCase } from '../../application/use-cases/find-challenges-by-course.use-case';
import { FindChallengesByProfessorUseCase } from '../../application/use-cases/find-challenges-by-professor.use-case';
import { FindVisibleChallengesByCourseUseCase } from '../../application/use-cases/find-visible-challenges-by-course.use-case';
import { FindVisibleChallengesByProfessorUseCase } from '../../application/use-cases/find-visible-challenges-by-professor.use-case';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly createChallengeUseCase: CreateChallengeUseCase,
    private readonly updateChallengeUseCase: UpdateChallengeUseCase,
    private readonly deleteChallengeUseCase: DeleteChallengeUseCase,
    private readonly findChallengeByIdUseCase: FindChallengeByIdUseCase,
    private readonly findChallengesByCourseUseCase: FindChallengesByCourseUseCase,
    private readonly findChallengesByProfessorUseCase: FindChallengesByProfessorUseCase,
    private readonly findVisibleChallengesByCourseUseCase: FindVisibleChallengesByCourseUseCase,
    private readonly findVisibleChallengesByProfessorUseCase: FindVisibleChallengesByProfessorUseCase,
    private readonly changeChallengeVisibilityUseCase: ChangeChallengeVisibilityUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Crear un nuevo reto' })
  async create(@Body() dto: CreateChallengeDto, @CurrentUser() user: User) {
    const challenge = await this.createChallengeUseCase.execute(dto, String(user.id));

    return {
      message: 'Reto creado exitosamente',
      data: challenge,
    };
  }

  @Get('course/:courseId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar retos de un curso con paginacion y filtro de visibilidad' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'visibility', required: false, enum: ['all', 'visible', 'invisible'], example: 'all' })
  async listByCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @Query() query: ListChallengesQueryDto) {
    return await this.findChallengesByCourseUseCase.execute(courseId, query);
  }

  @Get('course/:courseId/visible')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar retos visibles de un curso para estudiante con paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listVisibleByCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @Query() pagination: PaginationDto) {
    return await this.findVisibleChallengesByCourseUseCase.execute(courseId, pagination);
  }

  @Get('professor/:professorId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar retos creados por un profesor con paginacion y filtro de visibilidad' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'visibility', required: false, enum: ['all', 'visible', 'invisible'], example: 'all' })
  async listByProfessor(
    @Param('professorId', ParseUUIDPipe) professorId: string,
    @Query() query: ListChallengesQueryDto,
  ) {
    return await this.findChallengesByProfessorUseCase.execute(professorId, query);
  }

  @Get('professor/:professorId/visible')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar retos visibles creados por un profesor para estudiante con paginacion' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listVisibleByProfessor(
    @Param('professorId', ParseUUIDPipe) professorId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.findVisibleChallengesByProfessorUseCase.execute(professorId, pagination);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Obtener un reto por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.findChallengeByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Editar un reto' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChallengeDto) {
    const challenge = await this.updateChallengeUseCase.execute(id, dto);

    return {
      message: 'Reto actualizado exitosamente',
      data: challenge,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Eliminar un reto' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteChallengeUseCase.execute(id);
    return { message: 'Reto eliminado exitosamente' };
  }

  @Patch(':id/visibility')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Cambiar la visibilidad de un reto' })
  async changeVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeChallengeVisibilityDto,
  ) {
    const challenge = await this.changeChallengeVisibilityUseCase.execute(id, dto.visibility);

    return {
      message: 'Visibilidad del reto actualizada exitosamente',
      data: challenge,
    };
  }
}
