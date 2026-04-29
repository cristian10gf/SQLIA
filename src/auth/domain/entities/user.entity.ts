import { UUID } from 'crypto';
import { Role } from '../enums/role.enum';

export class User {
  constructor(
    public readonly id: UUID,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: Role,
    public readonly password?: string,
    public readonly createdAt?: Date,
  ) {
    if (!email || email.trim() === '') {
      throw new Error('El email es requerido');
    }
  }
}
