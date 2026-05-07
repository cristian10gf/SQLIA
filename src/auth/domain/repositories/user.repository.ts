import { Role } from '../enums/role.enum';
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findAllPaginated(
    skip: number,
    take: number,
  ): Promise<{ data: User[]; total: number }>;
  updateById(
    id: string,
    data: {
      email?: string;
      fullName?: string;
      role?: Role;
      passwordHash?: string;
    },
  ): Promise<User>;
  deleteById(id: string): Promise<void>;
  countByRole(role: Role): Promise<number>;
  existsAnotherUserWithEmail(email: string, excludeUserId: string): Promise<boolean>;
}
