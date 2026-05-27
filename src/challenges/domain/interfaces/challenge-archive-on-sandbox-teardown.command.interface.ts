export interface IChallengeArchiveOnSandboxTeardownCommand {
  archiveChallengeOnSandboxTeardown(challengeId: string): Promise<void>;
}
