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
import { Role } from '../../../auth/domain/enums/role.enum';
import { CreateEvaluationChallengeDto } from '../../application/dtos/create-evaluation-challenge.dto';
import { UpdateEvaluationChallengeDto } from '../../application/dtos/update-evaluation-challenge.dto';
import { PaginationDto } from '../../application/dtos/pagination.dto';
import { ListChallengesQueryDto } from '../../application/dtos/list-challenges-query.dto';
import { CreateEvaluationChallengeUseCase } from '../../application/use-cases/create-evaluation-challenge.use-case';
import { UpdateEvaluationChallengeUseCase } from '../../application/use-cases/update-evaluation-challenge.use-case';
import { DeleteEvaluationChallengeUseCase } from '../../application/use-cases/delete-evaluation-challenge.use-case';
import { FindChallengesByEvaluationUseCase } from '../../application/use-cases/find-challenges-by-evaluation.use-case';
import { FindVisibleChallengesByEvaluationUseCase } from '../../application/use-cases/find-visible-challenges-by-evaluation.use-case';

@ApiTags('Evaluation Challenges')
@Controller('evaluation-challenges')
export class EvaluationChallengeController {
  constructor(
    private readonly createEvaluationChallengeUseCase: CreateEvaluationChallengeUseCase,
    private readonly updateEvaluationChallengeUseCase: UpdateEvaluationChallengeUseCase,
    private readonly deleteEvaluationChallengeUseCase: DeleteEvaluationChallengeUseCase,
    private readonly findChallengesByEvaluationUseCase: FindChallengesByEvaluationUseCase,
    private readonly findVisibleChallengesByEvaluationUseCase: FindVisibleChallengesByEvaluationUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Asociar un reto a una evaluacion' })
  async create(@Body() dto: CreateEvaluationChallengeDto) {
    const evaluationChallenge = await this.createEvaluationChallengeUseCase.execute(dto);

    return {
      message: 'Reto asociado a la evaluacion exitosamente',
      data: evaluationChallenge,
    };
  }

  @Get('evaluation/:evaluationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar retos de una evaluacion para profesor con filtro de visibilidad' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'visibility', required: false, enum: ['all', 'visible', 'invisible'], example: 'all' })
  async listForProfessor(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
    @Query() query: ListChallengesQueryDto,
  ) {
    return await this.findChallengesByEvaluationUseCase.execute(evaluationId, query);
  }

  @Get('evaluation/:evaluationId/visible')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar retos visibles de una evaluacion para estudiante' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async listVisibleForStudent(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.findVisibleChallengesByEvaluationUseCase.execute(evaluationId, pagination);
  }

  @Patch(':evaluationId/:challengeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Editar la asociacion de un reto en una evaluacion' })
  async update(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Body() dto: UpdateEvaluationChallengeDto,
  ) {
    const evaluationChallenge = await this.updateEvaluationChallengeUseCase.execute(
      evaluationId,
      challengeId,
      dto,
    );

    return {
      message: 'Asociacion actualizada exitosamente',
      data: evaluationChallenge,
    };
  }

  @Delete(':evaluationId/:challengeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Desasociar un reto de una evaluacion' })
  async remove(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    await this.deleteEvaluationChallengeUseCase.execute(evaluationId, challengeId);
    return { message: 'Reto desasociado de la evaluación exitosamente' };
  }
}
