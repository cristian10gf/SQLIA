import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateEnrollmentUseCase } from '../../application/use-cases/create-enrollment.use-case';
import { CreateEnrollmentDto } from '../../application/dtos/create-enrollment.dto';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly createEnrollmentUseCase: CreateEnrollmentUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Enroll a student in a course' })
  async enroll(@Body() dto: CreateEnrollmentDto) {
    const result = await this.createEnrollmentUseCase.execute(dto);
    return {
      message: 'Inscripcion realizada con exito',
      data: result,
    };
  }
}