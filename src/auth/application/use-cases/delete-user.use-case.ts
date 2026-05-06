import type { IUserRepository } from '../../domain/repositories/user.repository';
import { Role } from '../../domain/enums/role.enum';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { CannotDeleteSelfError } from '../../domain/errors/cannot-delete-self.error';
import { LastAdminAccountError } from '../../domain/errors/last-admin-account.error';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(targetUserId: string, actorAdminId: string): Promise<void> {
    if (targetUserId === actorAdminId) {
      throw new CannotDeleteSelfError();
    }

    const existing = await this.userRepository.findById(targetUserId);
    if (!existing) {
      throw new UserNotFoundError();
    }

    if (existing.role === Role.ADMIN) {
      const adminCount = await this.userRepository.countByRole(Role.ADMIN);
      if (adminCount <= 1) {
        throw new LastAdminAccountError(
          'No se puede eliminar el único administrador del sistema',
        );
      }
    }

    await this.userRepository.deleteById(targetUserId);
  }
}
