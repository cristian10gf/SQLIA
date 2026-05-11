export class CannotDeleteSelfError extends Error {
  constructor(message: string = 'Un administrador no puede eliminar su propia cuenta') {
    super(message);
    this.name = 'CannotDeleteSelfError';
    Object.setPrototypeOf(this, CannotDeleteSelfError.prototype);
  }
}
