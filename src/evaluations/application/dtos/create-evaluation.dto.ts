import { IsString, IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvaluationDto {
  @IsUUID()
  courseId: string;

  @ApiProperty({ example: 'Evaluacion 1' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number = 1;
}