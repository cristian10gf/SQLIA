import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEvaluationVisibilityDto {
    @ApiProperty({ example: true })
    @Type(() => Boolean)
    @IsBoolean()
    isVisible: boolean;
}