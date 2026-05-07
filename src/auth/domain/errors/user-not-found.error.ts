export class UserNotFoundError extends Error {
  constructor(message: string = 'Usuario no encontrado') {
    super(message);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}
