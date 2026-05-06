import { IUserRepository } from '../../domain/repositories/user.repository';
import { UserResponseMapper } from '../mappers/user-response.mapper';
import { AdminPaginationDto } from '../dtos/admin-pagination.dto';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(paginationDto?: AdminPaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const { data, total } = await this.userRepository.findAllPaginated(
      skip,
      limit,
    );

    return {
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
      data: data.map((u) => UserResponseMapper.toDto(u)),
    };
  }
}
