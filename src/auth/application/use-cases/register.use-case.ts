import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IHashingService } from '../../domain/interfaces/hashing.interface';
import { RegisterDto } from '../dtos/register.dto';
import { GenerateTokenUseCase } from './generate-token.use-case';
import { User } from '../../domain/entities/user.entity';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import { AuthResponseMapper } from '../mappers/auth-response.mapper';
import { AdminRegistrationForbiddenError } from '../../domain/errors/admin-registration-forbidden.error';
import { Role } from '../../domain/enums/role.enum';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
    private readonly generateTokenUseCase: GenerateTokenUseCase,
  ) {}

  async execute(registerDto: RegisterDto): Promise<AuthResponseDto> {
    if (registerDto.role === Role.ADMIN) {
      throw new AdminRegistrationForbiddenError();
    }
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const hashedPassword = await this.hashingService.hash(registerDto.password);

    // Creamos la Entidad de Dominio pura usando new Data()
    const userToSave = new User(
      randomUUID(),
      registerDto.email,
      registerDto.fullName,
      registerDto.role,
      hashedPassword,
    );

    // Guardamos la entidad mediante el Port Repository
    await this.userRepository.save(userToSave);

    // Generamos Token y mapeamos a DTO
    const token = this.generateTokenUseCase.execute(userToSave);
    return AuthResponseMapper.toDto(userToSave, token);
  }
}
