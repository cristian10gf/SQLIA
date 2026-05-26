import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GenerateChallengeDto {
  @ApiProperty({
    example: `Crea un reto para aprender a usar GROUP BY y sumar por grupos`,
  })
  @IsNotEmpty({ message: 'Se necesitan las instrucciones.' })
  prompt: string;
}
