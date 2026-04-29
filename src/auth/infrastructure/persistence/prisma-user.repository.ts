import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

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
}
