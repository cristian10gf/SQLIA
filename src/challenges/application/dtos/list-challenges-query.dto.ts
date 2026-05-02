import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class ListChallengesQueryDto extends PaginationDto {
  @ApiProperty({ example: 'all', enum: ['all', 'visible', 'invisible'], required: false })
  @IsOptional()
  @IsIn(['all', 'visible', 'invisible'])
  visibility?: 'all' | 'visible' | 'invisible' = 'all';
}