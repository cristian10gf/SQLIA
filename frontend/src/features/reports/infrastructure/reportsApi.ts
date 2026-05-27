import { apiClient } from '../../../shared/infrastructure/http/apiClient';

export type StudentSubmissionSummary = {
  total: number;
  accepted: number;
  avgScore: number | null;
  avgExecutionTimeMs: number | null;
};

export type StudentSubmissionSummaryResponse = {
  message: string;
  data: StudentSubmissionSummary;
};

export type StudentSubmissionsResponse = {
  message: string;
  data: {
    courseId: string;
    studentId: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: Array<{
      submissionId: string;
      evaluation: {
        id: string;
        title: string;
      };
      score: number | null;
      status: string;
      submittedAt: string;
    }>;
  };
};

export const reportsApi = {
  getStudentSubmissionSummary(courseId: string, studentId: string, token: string) {
    return apiClient.get<StudentSubmissionSummaryResponse>(
      `/reports/courses/${courseId}/students/${studentId}/summary`,
      token,
    );
  },

  getStudentSubmissions(
    courseId: string,
    studentId: string,
    token: string,
    page = 1,
    limit = 10,
  ) {
    return apiClient.get<StudentSubmissionsResponse>(
      `/reports/courses/${courseId}/students/${studentId}/submissions?page=${page}&limit=${limit}`,
      token,
    );
  },
};
