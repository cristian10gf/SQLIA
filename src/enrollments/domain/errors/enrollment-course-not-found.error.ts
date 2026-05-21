export class EnrollmentCourseNotFoundError extends Error {
  constructor(message: string = 'Curso no encontrado') {
    super(message);
    this.name = 'EnrollmentCourseNotFoundError';
    Object.setPrototypeOf(this, EnrollmentCourseNotFoundError.prototype);
  }
}
