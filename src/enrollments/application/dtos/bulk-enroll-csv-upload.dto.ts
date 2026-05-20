import { ApiProperty } from '@nestjs/swagger';
import {
  BRIGHTSPACE_ENROLLMENT_CSV_HEADER_ORDER,
} from '../../domain/read-models/brightspace-enrollment-csv.format';

const CSV_HEADER_LINE = BRIGHTSPACE_ENROLLMENT_CSV_HEADER_ORDER.join(',');

const CSV_SAMPLE_ROW =
  'CategoriaAleatoriaPrueba,Group 1,grp_156874_9417_1,almachado@uninorte.edu.co,365008,LUIS,LOPEZ MACHADO,almachado@uninorte.edu.co,9 de marzo de 2026 16:01';


export class BulkEnrollCsvUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: [
      'Archivo **CSV UTF-8** exportado desde Brightspace: **Groups → [categoría] → Export → All Groups**.',
      '',
      '**Ejemplo de filas:**',
      '```csv',
      CSV_HEADER_LINE,
      CSV_SAMPLE_ROW,
      '```',
    ].join('\n'),
  })
  file: unknown;
}
