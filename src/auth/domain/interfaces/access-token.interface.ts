export interface AccessTokenClaims {
  readonly sub: string;
}

/** Payload tras verificar el JWT (sub + timestamps opcionales). */
export interface DecodedAccessTokenPayload extends AccessTokenClaims {
  readonly iat?: number;
  readonly exp?: number;
}
