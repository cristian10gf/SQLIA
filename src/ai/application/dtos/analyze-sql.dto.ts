import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AnalyzeSqlDto {
  @ApiProperty({ example: 'SELECT * FROM data' })
  @IsNotEmpty({ message: 'La consulta SQL no puede estar vacia.' })
  query: string;

  @ApiProperty({
    example: 'CREATE TABLE data (id SERIAL PRIMARY KEY, info VARCHAR(100))',
  })
  @IsNotEmpty({ message: 'Es necesario el esquema.' })
  schema: string;
}
