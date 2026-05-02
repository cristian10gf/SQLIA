import { IsString, IsEnum, IsObject, IsOptional, IsInt, Min } from 'class-validator';
import { ChallengeVisibility } from '../../domain/enums/challenge-visibility.enum';
import { DifficultyLevel } from '../../domain/enums/difficulty-level.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChallengeDto {
  @ApiProperty({ example: 'course-uuid' })
  @IsString()
  courseId: string;
  @ApiProperty({ example: 'SQL Basico' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Aprender SQL basico' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DifficultyLevel, example: 'EASY' })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({ enum: ChallengeVisibility, example: 'PRIVATE' })
  @IsEnum(ChallengeVisibility)
  visibility: ChallengeVisibility;

  @ApiProperty({ example: 'PostgreSQL' })
  @IsOptional()
  @IsString()
  databaseEngine?: string = 'PostgreSQL';

  @ApiProperty({ example: 'CREATE TABLE users (id UUID PRIMARY KEY);' })
  @IsString()
  schemaDefinition: string;

  @ApiProperty({ example: 'INSERT INTO users VALUES (...);', required: false })
  @IsOptional()
  @IsString()
  seedScript?: string;

  @ApiProperty({ example: { resultCount: 5 } })
  @IsObject()
  expectedResult: Record<string, any>;

  @ApiProperty({ example: 2000 })
  @IsOptional()
  @IsInt()
  @Min(100)
  timeLimitMs?: number = 2000;
}
