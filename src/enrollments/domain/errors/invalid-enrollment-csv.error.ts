export class InvalidEnrollmentCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEnrollmentCsvError';
    Object.setPrototypeOf(this, InvalidEnrollmentCsvError.prototype);
  }
}
