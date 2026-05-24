export interface IAiProvider {
  getOptimizationTips(query: string, results: string): Promise<string>;
  generateRandomData(schema: string, prompt: string): Promise<string>;
  generateChallenge(prompt: string): Promise<string>;
}
