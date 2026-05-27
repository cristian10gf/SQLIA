import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { parse } from 'csv-parse/sync';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';
import type { IHashingService } from '../../domain/interfaces/hashing.interface';
import { HASHING_SERVICE } from '../../domain/interfaces/hashing.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';

export interface ImportStudentsResult {
  total: number;
  created: number;
  alreadyExisted: number;
  errors: string[];
}

interface CsvRow {
  [key: string]: string | undefined;
}

@Injectable()
export class ImportStudentsFromCsvUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(HASHING_SERVICE)
    private readonly hashingService: IHashingService,
  ) {}

  async execute(csvContent: string): Promise<ImportStudentsResult> {
    const rows = this.parseCsv(csvContent);

    const result: ImportStudentsResult = {
      total: rows.length,
      created: 0,
      alreadyExisted: 0,
      errors: [],
    };

    for (const row of rows) {
      const email = this.extractColumn(row, 'email address')?.trim().toLowerCase();
      if (!email) {
        result.errors.push(`Fila sin email válido`);
        continue;
      }

      const firstName = this.extractColumn(row, 'first name')?.trim() ?? '';
      const lastName = this.extractColumn(row, 'last name')?.trim() ?? '';
      const fullName = `${firstName} ${lastName}`.trim() || email;

      const existing = await this.userRepository.findByEmail(email);
      if (existing) {
        result.alreadyExisted++;
        continue;
      }

      const passwordHash = await this.hashingService.hash(email);
      const student = new User(randomUUID(), email, fullName, Role.STUDENT, passwordHash);
      await this.userRepository.save(student);
      result.created++;
    }

    return result;
  }

  private parseCsv(csvContent: string): CsvRow[] {
    const normalized = csvContent.trim();
    if (!normalized) return [];

    try {
      return parse(normalized, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      }) as CsvRow[];
    } catch {
      return [];
    }
  }

  private extractColumn(row: CsvRow, columnName: string): string | undefined {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === columnName,
    );
    return key ? row[key] : undefined;
  }
}
