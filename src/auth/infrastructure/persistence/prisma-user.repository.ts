import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';
import { UserMapper } from '../mappers/user.mapper';
import { UserDeleteBlockedError } from '../../domain/errors/user-delete-blocked.error';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.prisma.user.findUnique({ where: { email } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async findById(id: string): Promise<User | null> {
    const model = await this.prisma.user.findUnique({ where: { id } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async save(user: User): Promise<void> {
    const persistenceData = UserMapper.toPersistence(user);
    await this.prisma.user.create({
      data: persistenceData,
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
  ): Promise<{ data: User[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: rows.map((r) => UserMapper.toDomain(r)),
      total,
    };
  }

  async updateById(
    id: string,
    data: {
      email?: string;
      fullName?: string;
      role?: Role;
      passwordHash?: string;
    },
  ): Promise<User> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.role !== undefined) updateData.role = data.role as UserRole;
    if (data.passwordHash !== undefined) updateData.password = data.passwordHash;

    const model = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return UserMapper.toDomain(model);
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new UserDeleteBlockedError();
      }
      throw e;
    }
  }

  async countByRole(role: Role): Promise<number> {
    return this.prisma.user.count({
      where: { role: role as UserRole },
    });
  }

  async existsAnotherUserWithEmail(
    email: string,
    excludeUserId: string,
  ): Promise<boolean> {
    const found = await this.prisma.user.findFirst({
      where: {
        email,
        NOT: { id: excludeUserId },
      },
      select: { id: true },
    });
    return found !== null;
  }
}
