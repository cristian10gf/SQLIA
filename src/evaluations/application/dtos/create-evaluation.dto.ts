import { IsString, IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvaluationDto {
    @ApiProperty({ example: 'course-uuid' })
    @IsUUID()
    courseId: string;

    @ApiProperty({ example: 'Evaluacion 1' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Descripción de la evaluación' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })   
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2026-05-31T23:59:59.000Z' })
    @IsDateString()
    endDate: string;

    @ApiProperty({ example: 60 })
    @IsInt()
    @Min(1)
    durationMinutes: number;

    @ApiProperty({ example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxAttempts?: number = 1;
}