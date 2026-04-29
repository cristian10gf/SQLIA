export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Credenciales inválidas') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}
