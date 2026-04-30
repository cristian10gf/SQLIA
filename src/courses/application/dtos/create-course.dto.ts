import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  group: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  professorId: string;
}