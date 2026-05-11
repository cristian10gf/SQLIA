export class AdminRegistrationForbiddenError extends Error {
  constructor(
    message: string = 'El rol ADMIN no puede registrarse públicamente',
  ) {
    super(message);
    this.name = 'AdminRegistrationForbiddenError';
    Object.setPrototypeOf(this, AdminRegistrationForbiddenError.prototype);
  }
}
