export class EmailAlreadyInUseError extends Error {
  constructor(message: string = 'El correo ya está en uso por otro usuario') {
    super(message);
    this.name = 'EmailAlreadyInUseError';
    Object.setPrototypeOf(this, EmailAlreadyInUseError.prototype);
  }
}
