import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateEnrollmentUseCase } from '../../application/use-cases/create-enrollment.use-case';
import { CreateEnrollmentDto } from '../../application/dtos/create-enrollment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly createEnrollmentUseCase: CreateEnrollmentUseCase) {}

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
}