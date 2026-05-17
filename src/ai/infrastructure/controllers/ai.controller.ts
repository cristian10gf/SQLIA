import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyzeSqlUseCase } from '../../application/use-cases/analyze-sql.use-case';
import { AnalyzeSqlDto } from '../../application/dtos/analyze-sql.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../auth/domain/enums/role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly analyzeSqlUseCase: AnalyzeSqlUseCase) {}

  @Post('analyze-sql')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Analizar consultas SQL' })
  async analyzeSql(@Body() dto: AnalyzeSqlDto) {
    return await this.analyzeSqlUseCase.execute(dto);
  }
}
