export interface IChallengePublishForSandboxCommand {
  publishChallengeForSandboxProvision(challengeId: string): Promise<void>;
}
