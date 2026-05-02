export class Evaluation {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly createdBy: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly durationMinutes: number,
    public readonly maxAttempts: number,
    public readonly isVisible: boolean,
    public readonly createdAt?: Date,
  ) {}
}