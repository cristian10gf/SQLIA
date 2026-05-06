export class UserDeleteBlockedError extends Error {
  constructor(
    message: string = 'No se puede eliminar el usuario: tiene datos asociados en la plataforma',
  ) {
    super(message);
    this.name = 'UserDeleteBlockedError';
    Object.setPrototypeOf(this, UserDeleteBlockedError.prototype);
  }
}
