export class EnrollmentForbiddenError extends Error {
  constructor(message: string = 'No tenés permiso para esta operacion') {
    super(message);
    this.name = 'EnrollmentForbiddenError';
    Object.setPrototypeOf(this, EnrollmentForbiddenError.prototype);
  }
}
