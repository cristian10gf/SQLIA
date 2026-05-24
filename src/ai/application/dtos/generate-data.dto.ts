import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GenerateDataDto {
  @ApiProperty({
    example: `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(80) NOT NULL
);`,
  })
  @IsNotEmpty({ message: 'El esquema es necesario.' })
  query: string;

  @ApiProperty({
    example: `Inserta 10 datos. La columna City puede contener 'Bogotá' o 'Barranquilla''`,
  })
  @IsNotEmpty({ message: 'Se necesitan las instrucciones.' })
  results: string;
}
