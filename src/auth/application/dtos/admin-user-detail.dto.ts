import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserDetailDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'STUDENT' })
  role: string;

  @ApiPropertyOptional({ example: '2026-01-15T10:00:00.000Z' })
  createdAt?: string;
}
