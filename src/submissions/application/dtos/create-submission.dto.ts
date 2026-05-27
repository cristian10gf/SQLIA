import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Consulta SQL del estudiante' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ description: 'ID del reto a evaluar' })
  @IsUUID()
  challengeId: string;

  @ApiPropertyOptional({ description: 'ID de la evaluación (opcional)' })
  @IsUUID()
  @IsOptional()
  evaluationId?: string;
}
