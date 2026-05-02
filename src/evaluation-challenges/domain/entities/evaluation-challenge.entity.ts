export class EvaluationChallenge {
  constructor(
    public readonly evaluationId: string,
    public readonly challengeId: string,
    public readonly orderIndex: number | null,
    public readonly points: number,
  ) {}
}
