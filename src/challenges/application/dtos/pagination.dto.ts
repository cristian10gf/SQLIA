import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(function () {
    return Number;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(function () {
    return Number;
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}