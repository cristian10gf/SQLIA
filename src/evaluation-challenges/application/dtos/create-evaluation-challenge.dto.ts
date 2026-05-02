import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateEvaluationChallengeDto {
  @ApiProperty({ example: 'eva-123' })
  @IsUUID()
  evaluationId: string;

  @ApiProperty({ example: 'ch-456' })
  @IsUUID()
  challengeId: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number = 10;
}
