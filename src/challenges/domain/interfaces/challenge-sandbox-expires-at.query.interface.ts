export interface IChallengeSandboxExpiresAtQuery {
  resolveExpiresAt(challengeId: string): Promise<Date>;
}
