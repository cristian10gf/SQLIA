import { IsEnum} from 'class-validator';
import { ChallengeVisibility } from '../../domain/enums/challenge-visibility.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeChallengeVisibilityDto {
  @ApiProperty({ enum: ChallengeVisibility, example: 'PUBLIC' })
  @IsEnum(ChallengeVisibility)
  visibility: ChallengeVisibility;
}
