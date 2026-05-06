import type { AccessTokenClaims } from './access-token.interface';

export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

export interface ITokenProvider {
  generateToken(payload: AccessTokenClaims): string;
}
