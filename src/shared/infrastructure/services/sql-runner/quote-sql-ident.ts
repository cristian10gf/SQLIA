import { BadRequestException } from '@nestjs/common';

export function quoteSqlIdentifier(ident: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident)) {
    throw new BadRequestException(`Identificador de schema inválido: ${ident}`);
  }
  return `"${ident.replace(/"/g, '""')}"`;
}
