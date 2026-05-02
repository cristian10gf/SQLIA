import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ListEvaluationsQueryDto extends PaginationDto {
  @ApiProperty({ example: 'all', enum: ['all', 'visible', 'invisible'], required: false })
  @IsOptional()
  @IsIn(['all', 'visible', 'invisible'])
  visibility?: 'all' | 'visible' | 'invisible' = 'all';
}