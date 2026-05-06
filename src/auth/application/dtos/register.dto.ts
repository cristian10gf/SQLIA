import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../domain/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'test@test.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  fullName: string;

  @ApiProperty({
    enum: Role,
    example: Role.STUDENT,
    description: 'No usar ADMIN en registro público; los administradores se crean o promueven desde la API de usuarios.',
  })
  @IsEnum(Role)
  role: Role;
}
