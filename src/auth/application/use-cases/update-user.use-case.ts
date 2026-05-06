import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IHashingService } from '../../domain/interfaces/hashing.interface';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Role } from '../../domain/enums/role.enum';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { LastAdminAccountError } from '../../domain/errors/last-admin-account.error';
import { UserResponseMapper } from '../mappers/user-response.mapper';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
  ) {}

  async execute(userId: string, dto: UpdateUserDto) {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new UserNotFoundError();
    }

    if (dto.email !== undefined && dto.email !== existing.email) {
      const taken = await this.userRepository.existsAnotherUserWithEmail(
        dto.email,
        userId,
      );
      if (taken) {
        throw new EmailAlreadyInUseError();
      }
    }

    if (dto.role !== undefined && dto.role !== Role.ADMIN) {
      if (existing.role === Role.ADMIN) {
        const adminCount = await this.userRepository.countByRole(Role.ADMIN);
        if (adminCount <= 1) {
          throw new LastAdminAccountError();
        }
      }
    }

    const payload: {
      email?: string;
      fullName?: string;
      role?: Role;
      passwordHash?: string;
    } = {};

    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.fullName !== undefined) payload.fullName = dto.fullName;
    if (dto.role !== undefined) payload.role = dto.role;
    if (dto.password !== undefined) {
      payload.passwordHash = await this.hashingService.hash(dto.password);
    }

    const updated = await this.userRepository.updateById(userId, payload);
    return UserResponseMapper.toDto(updated);
  }
}
