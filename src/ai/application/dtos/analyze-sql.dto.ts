import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AnalyzeSqlDto {
  @ApiProperty({ example: 'SELECT * FROM data' })
  @IsNotEmpty({ message: 'La consulta SQL no puede estar vacia.' })
  query: string;

  @ApiProperty({
    example: `{
  "data": [
    {
      "id": 1,
      "nombre": "Juan Perez"
    }
  ],
  "rowCount": 1
}`,
  })
  @IsNotEmpty({ message: 'Se necesitan los resultados.' })
  results: string;
}
