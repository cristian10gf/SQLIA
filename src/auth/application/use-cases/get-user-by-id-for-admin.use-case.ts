import type { IUserRepository } from '../../domain/repositories/user.repository';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserResponseMapper } from '../mappers/user-response.mapper';

export class GetUserByIdForAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return UserResponseMapper.toAdminDetailDto(user);
  }
}
