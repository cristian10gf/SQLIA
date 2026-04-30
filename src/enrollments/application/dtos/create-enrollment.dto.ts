import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}