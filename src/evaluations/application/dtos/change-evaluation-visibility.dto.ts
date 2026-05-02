import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ChangeEvaluationVisibilityDto {
  @Type(() => Boolean)
  @IsBoolean()
  isVisible: boolean;
}