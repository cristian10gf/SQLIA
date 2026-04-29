export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

export interface ITokenProvider {
  generateToken(payload: any): string;
}
