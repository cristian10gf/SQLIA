import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { User } from '../../../auth/domain/entities/user.entity';
import { CreateSubmissionDto } from '../../application/dtos/create-submission.dto';
import { CreateSubmissionUseCase } from '../../application/use-cases/create-submission.use-case';
import { GetSubmissionByIdUseCase } from '../../application/use-cases/get-submission-by-id.use-case';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly createSubmissionUseCase: CreateSubmissionUseCase,
    private readonly getSubmissionByIdUseCase: GetSubmissionByIdUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Crear submission y encolar evaluación SQL' })
  async create(@Body() dto: CreateSubmissionDto, @CurrentUser() user: User) {
    return this.createSubmissionUseCase.execute(dto, String(user.id));
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar estado y resultado de una submission' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.getSubmissionByIdUseCase.execute(
      id,
      String(user.id),
      String(user.role),
    );
  }
}
