import { ApiProperty } from '@nestjs/swagger';
import {
  BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS,
  BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE,
  type BrightspaceEnrollmentCsvRow,
} from '../../domain/read-models/brightspace-enrollment-csv.format';

export type { BrightspaceEnrollmentCsvRow };


export class BrightspaceEnrollmentCsvRowDto implements BrightspaceEnrollmentCsvRow {
  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_CATEGORY_NAME,
    description: 'Nombre de la categoría de grupos en Brightspace.',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_CATEGORY_NAME],
  })
  'Group Category Name': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_NAME,
    description: 'Nombre del grupo (p. ej. Group 1, Group 2).',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_NAME],
  })
  'Group Name': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_CODE,
    description: 'Código interno del grupo en Brightspace.',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_CODE],
  })
  'Group Code': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.USERNAME,
    description: 'Usuario / identificador de acceso (suele coincidir con el correo).',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.USERNAME],
  })
  Username: string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.ORG_DEFINED_ID,
    description: 'ID definido por la organización (código estudiantil).',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.ORG_DEFINED_ID],
  })
  OrgDefinedId: string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.FIRST_NAME,
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.FIRST_NAME],
  })
  'First Name': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.LAST_NAME,
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.LAST_NAME],
  })
  'Last Name': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.EMAIL_ADDRESS,
    description:
      'Correo del estudiante. **Columna requerida**: se usa para buscar al usuario en SQLIA e inscribirlo en el curso.',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.EMAIL_ADDRESS],
  })
  'Email Address': string;

  @ApiProperty({
    name: BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_ENROLLMENT_DATE,
    description: 'Fecha de inscripción al grupo (texto localizado; no se persiste en SQLIA).',
    example:
      BRIGHTSPACE_ENROLLMENT_CSV_ROW_EXAMPLE[
        BRIGHTSPACE_ENROLLMENT_CSV_COLUMNS.GROUP_ENROLLMENT_DATE
      ],
  })
  'Group Enrollment Date': string;
}
