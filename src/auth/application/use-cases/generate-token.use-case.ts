import { User } from '../../domain/entities/user.entity';
import { ITokenProvider } from '../../domain/interfaces/token-provider.interface';

export class GenerateTokenUseCase {
  constructor(private readonly tokenProvider: ITokenProvider) {}

  execute(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.tokenProvider.generateToken(payload);
  }
}
