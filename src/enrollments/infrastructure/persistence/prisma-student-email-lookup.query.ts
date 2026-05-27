import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IStudentEmailLookupQuery,
  StudentEmailLookupRow,
} from '../../domain/interfaces/student-email-lookup.query.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class PrismaStudentEmailLookupQuery implements IStudentEmailLookupQuery {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmails(emails: string[]): Promise<StudentEmailLookupRow[]> {
    if (emails.length === 0) return [];

    const rows = await this.prisma.user.findMany({
      where: {
        email: { in: emails, mode: 'insensitive' },
        role: UserRole.STUDENT,
      },
      select: { id: true, email: true, role: true },
    });

    return rows.map(
      (row): StudentEmailLookupRow => ({
        id: row.id,
        email: row.email,
        role: row.role,
      }),
    );
  }
}
