export type StudentEmailLookupRow = {
  id: string;
  email: string;
  role: string;
};

export interface IStudentEmailLookupQuery {
  findByEmails(emails: string[]): Promise<StudentEmailLookupRow[]>;
}
