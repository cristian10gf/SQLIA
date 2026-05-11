import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationChallengeDto } from './create-evaluation-challenge.dto';

export class UpdateEvaluationChallengeDto extends PartialType(CreateEvaluationChallengeDto) {}
