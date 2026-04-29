export class EmailAlreadyRegisteredError extends Error {
  constructor(message: string = 'El correo ya está registrado') {
    super(message);
    this.name = 'EmailAlreadyRegisteredError';
    Object.setPrototypeOf(this, EmailAlreadyRegisteredError.prototype);
  }
}
