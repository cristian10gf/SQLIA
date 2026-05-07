import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dtos/user-response.dto';
import { AdminUserDetailDto } from '../dtos/admin-user-detail.dto';

export class UserResponseMapper {
  static toDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  static toAdminDetailDto(user: User): AdminUserDetailDto {
    const dto: AdminUserDetailDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    if (user.createdAt) {
      dto.createdAt = user.createdAt.toISOString();
    }
    return dto;
  }
}
