import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyzeSqlUseCase } from '../../application/use-cases/analyze-sql.use-case';
import { AnalyzeSqlDto } from '../../application/dtos/analyze-sql.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../auth/domain/enums/role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GenerateDataUseCase } from '../../application/use-cases/generate-data.use-case';
import { GenerateDataDto } from '../../application/dtos/generate-data.dto';
import { GenerateChallengeUseCase } from '../../application/use-cases/generate-challenge.use-case';
import { GenerateChallengeDto } from '../../application/dtos/generate-challenge.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly analyzeSqlUseCase: AnalyzeSqlUseCase,
    private readonly generateDataUseCase: GenerateDataUseCase,
    private readonly generateChallengeUseCase: GenerateChallengeUseCase,
  ) {}

  @Post('analyze-sql')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Analizar consultas SQL' })
  async analyzeSql(@Body() dto: AnalyzeSqlDto) {
    return await this.analyzeSqlUseCase.execute(dto);
  }

  @Post('generate-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Generar datos de prueba SQL' })
  async generateData(@Body() dto: GenerateDataDto) {
    return await this.generateDataUseCase.execute(dto);
  }

  @Post('generate-challenge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Generar datos de prueba SQL' })
  async generateChallenge(@Body() dto: GenerateChallengeDto) {
    return await this.generateChallengeUseCase.execute(dto);
  }
}
