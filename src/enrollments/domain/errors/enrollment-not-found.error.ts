export class EnrollmentNotFoundError extends Error {
  constructor(message: string = 'La inscripcion no existe') {
    super(message);
    this.name = 'EnrollmentNotFoundError';
    Object.setPrototypeOf(this, EnrollmentNotFoundError.prototype);
  }
}
