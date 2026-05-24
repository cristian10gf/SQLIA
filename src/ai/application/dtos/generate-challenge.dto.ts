import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GenerateChallengeDto {
  @ApiProperty({
    example: `Inserta 10 datos. La columna City puede contener 'Bogotá' o 'Barranquilla''`,
  })
  @IsNotEmpty({ message: 'Se necesitan las instrucciones.' })
  results: string;
}
