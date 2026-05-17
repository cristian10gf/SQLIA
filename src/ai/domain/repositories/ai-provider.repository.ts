export interface IAiProvider {
  getOptimizationTips(query: string, schema: string): Promise<string>;
}
