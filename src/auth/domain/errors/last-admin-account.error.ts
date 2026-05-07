export class LastAdminAccountError extends Error {
  constructor(message: string = 'Debe existir al menos un usuario con rol ADMIN') {
    super(message);
    this.name = 'LastAdminAccountError';
    Object.setPrototypeOf(this, LastAdminAccountError.prototype);
  }
}
