import { User } from '../../domain/entities/user.entity';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UserResponseMapper } from './user-response.mapper';

export class AuthResponseMapper {
  static toDto(user: User, accessToken: string): AuthResponseDto {
    return {
      accessToken,
      user: UserResponseMapper.toDto(user),
    };
  }
}
