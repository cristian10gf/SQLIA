export class EnrollmentAlreadyExistsError extends Error {
  constructor(
    message: string = 'El estudiante ya esta inscrito en este curso',
  ) {
    super(message);
    this.name = 'EnrollmentAlreadyExistsError';
    Object.setPrototypeOf(this, EnrollmentAlreadyExistsError.prototype);
  }
}
