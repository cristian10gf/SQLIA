import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class ListEvaluationsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['all', 'visible', 'invisible'])
  visibility?: 'all' | 'visible' | 'invisible' = 'all';
}