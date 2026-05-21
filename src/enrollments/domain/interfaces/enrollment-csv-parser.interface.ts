export interface IEnrollmentCsvParser {
  extractEmails(csvContent: string): string[];
}
