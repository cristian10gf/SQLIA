export interface ISqlJob {
  submissionId: string;
  query: string;
  schema: string;
  expectedResult: any;
}
