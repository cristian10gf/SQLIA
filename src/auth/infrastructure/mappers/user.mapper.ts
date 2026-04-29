import { User as PrismaUser, Prisma } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { UUID } from 'crypto';
import { Role } from '../../domain/enums/role.enum';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id as UUID,
      prismaUser.email,
      prismaUser.fullName,
      prismaUser.role as Role,
      prismaUser.password,
      prismaUser.createdAt,
    );
  }

  // Actúa como el toDto() hacia la base de datos (Persistence DTO)
  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: user.password!,
      createdAt: user.createdAt,
    };
  }
}
