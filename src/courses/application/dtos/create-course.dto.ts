import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Backend' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'B-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '2026-1' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({ example: 'Grupo 1' } )
  @IsString()
  @IsNotEmpty()
  group: string;

  @ApiProperty({ example: 'professor-123' })
  @IsString()
  @IsNotEmpty()
  professorId: string;
}