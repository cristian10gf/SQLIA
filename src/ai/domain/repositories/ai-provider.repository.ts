export interface IAiProvider {
  getOptimizationTips(
    query: string,
    expected: string,
    results: string,
  ): Promise<string>;
  generateRandomData(
    schema: string,
    prompt: string,
  ): Promise<{ result: string }>;
  generateChallenge(prompt: string): Promise<{ result: string }>;
}
