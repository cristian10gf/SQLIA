import { parse } from 'csv-parse/sync';
import { Injectable } from '@nestjs/common';
import { InvalidEnrollmentCsvError } from '../../domain/errors/invalid-enrollment-csv.error';
import {
  BRIGHTSPACE_ENROLLMENT_EMAIL_COLUMN,
  type BrightspaceEnrollmentCsvRow,
} from '../../domain/read-models/brightspace-enrollment-csv.format';
import type { IEnrollmentCsvParser } from '../../domain/interfaces/enrollment-csv-parser.interface';

const EMAIL_COLUMN = BRIGHTSPACE_ENROLLMENT_EMAIL_COLUMN.toLowerCase();

@Injectable()
export class BrightspaceEnrollmentCsvParser implements IEnrollmentCsvParser {
  extractEmails(csvContent: string): string[] {
    const normalized = csvContent.trim();
    if (!normalized) {
      throw new InvalidEnrollmentCsvError('El archivo CSV está vacío');
    }

    let rows: BrightspaceEnrollmentCsvRow[];
    try {
      rows = parse(normalized, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      }) as BrightspaceEnrollmentCsvRow[];
    } catch {
      throw new InvalidEnrollmentCsvError(
        'El archivo CSV no tiene un formato válido',
      );
    }

    if (rows.length === 0) {
      throw new InvalidEnrollmentCsvError(
        'El CSV debe incluir encabezado y al menos una fila de estudiantes',
      );
    }

    const headerKey = Object.keys(rows[0]).find(
      (key) => key.trim().toLowerCase() === EMAIL_COLUMN,
    );
    if (!headerKey) {
      throw new InvalidEnrollmentCsvError(
        'El CSV debe contener la columna "Email Address"',
      );
    }

    const emails = rows
      .map((row) => row[headerKey as keyof BrightspaceEnrollmentCsvRow]?.trim())
      .filter((email): email is string => Boolean(email));

    if (emails.length === 0) {
      throw new InvalidEnrollmentCsvError(
        'No se encontraron correos en la columna "Email Address"',
      );
    }

    return emails;
  }
}
