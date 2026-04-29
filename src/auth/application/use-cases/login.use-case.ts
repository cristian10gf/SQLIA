import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IHashingService } from '../../domain/interfaces/hashing.interface';
import { LoginDto } from '../dtos/login.dto';
import { GenerateTokenUseCase } from './generate-token.use-case';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AuthResponseMapper } from '../mappers/auth-response.mapper';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
    private readonly generateTokenUseCase: GenerateTokenUseCase,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.hashingService.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = this.generateTokenUseCase.execute(user);
    return AuthResponseMapper.toDto(user, token);
  }
}
