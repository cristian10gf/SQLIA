import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class ListChallengesQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['all', 'visible', 'invisible'])
  visibility?: 'all' | 'visible' | 'invisible' = 'all';
}
