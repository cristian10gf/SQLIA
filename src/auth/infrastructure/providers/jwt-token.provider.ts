import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenClaims } from '../../domain/interfaces/access-token.interface';
import { ITokenProvider } from '../../domain/interfaces/token-provider.interface';

@Injectable()
export class JwtTokenProvider implements ITokenProvider {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: AccessTokenClaims): string {
    return this.jwtService.sign(payload);
  }
}
