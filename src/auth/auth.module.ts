import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './infrastructure/controllers/auth.controller';
import { AdminUsersController } from './infrastructure/controllers/admin-users.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { GenerateTokenUseCase } from './application/use-cases/generate-token.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { GetUserByIdForAdminUseCase } from './application/use-cases/get-user-by-id-for-admin.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';

import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { BcryptAdapter } from './infrastructure/persistence/bcrypt.adapter';
import { JwtTokenProvider } from './infrastructure/providers/jwt-token.provider';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

import {
  USER_REPOSITORY,
  IUserRepository,
} from './domain/repositories/user.repository';
import {
  HASHING_SERVICE,
  IHashingService,
} from './domain/interfaces/hashing.interface';
import {
  TOKEN_PROVIDER,
  ITokenProvider,
} from './domain/interfaces/token-provider.interface';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-key'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController, AdminUsersController],
  providers: [
    JwtStrategy,
    // 1. Vinculamos los Tokens (Puertos) con las Clases (Adaptadores/Implementaciones)
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: HASHING_SERVICE,
      useClass: BcryptAdapter,
    },
    {
      provide: TOKEN_PROVIDER,
      useClass: JwtTokenProvider,
    },
    // 2. Configuramos los Casos de Uso inyectando los Repositorios y Servicios
    {
      provide: GenerateTokenUseCase,
      inject: [TOKEN_PROVIDER],
      useFactory: (tokenProvider: ITokenProvider) =>
        new GenerateTokenUseCase(tokenProvider),
    },
    {
      provide: RegisterUseCase,
      inject: [USER_REPOSITORY, HASHING_SERVICE, GenerateTokenUseCase],
      useFactory: (
        userRepo: IUserRepository,
        hashingSvc: IHashingService,
        generateTokenUseCase: GenerateTokenUseCase,
      ) => new RegisterUseCase(userRepo, hashingSvc, generateTokenUseCase),
    },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, HASHING_SERVICE, GenerateTokenUseCase],
      useFactory: (
        userRepo: IUserRepository,
        hashingSvc: IHashingService,
        generateTokenUseCase: GenerateTokenUseCase,
      ) => new LoginUseCase(userRepo, hashingSvc, generateTokenUseCase),
    },
    {
      provide: ListUsersUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (userRepo: IUserRepository) =>
        new ListUsersUseCase(userRepo),
    },
    {
      provide: GetUserByIdForAdminUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (userRepo: IUserRepository) =>
        new GetUserByIdForAdminUseCase(userRepo),
    },
    {
      provide: UpdateUserUseCase,
      inject: [USER_REPOSITORY, HASHING_SERVICE],
      useFactory: (
        userRepo: IUserRepository,
        hashingSvc: IHashingService,
      ) => new UpdateUserUseCase(userRepo, hashingSvc),
    },
    {
      provide: DeleteUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (userRepo: IUserRepository) =>
        new DeleteUserUseCase(userRepo),
    },
  ],
})
export class AuthModule {}
