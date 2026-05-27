export type StudentInCourse = {
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  enrolledAt: string;
};

export type StudentsPageResponse = {
  data: StudentInCourse[];
  total: number;
};

export type BulkEnrollResult = {
  totalRowsInCsv: number;
  uniqueEmailsInCsv: number;
  enrolled: number;
  alreadyEnrolled: number;
  notFound: number;
  notStudentRole: number;
  duplicateEmailsInCsv: number;
  notFoundEmails: string[];
  notStudentEmails: string[];
};

export type BulkEnrollResponse = {
  message: string;
  data: BulkEnrollResult;
};
