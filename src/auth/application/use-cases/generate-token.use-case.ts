import { User } from '../../domain/entities/user.entity';
import type { AccessTokenClaims } from '../../domain/interfaces/access-token.interface';
import { ITokenProvider } from '../../domain/interfaces/token-provider.interface';

export class GenerateTokenUseCase {
  constructor(private readonly tokenProvider: ITokenProvider) {}

  execute(user: User): string {
    const claims: AccessTokenClaims = { sub: user.id };
    return this.tokenProvider.generateToken(claims);
  }
}