import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type { BulkEnrollResponse, StudentsPageResponse } from '../domain/enrollment.types';

export const enrollmentApi = {
  bulkEnrollFromCsv(courseId: string, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<BulkEnrollResponse>(
      `/enrollments/course/${courseId}/bulk-csv`,
      formData,
      token,
    );
  },

  getStudentsByCourse(courseId: string, token: string, page = 1, limit = 10) {
    return apiClient.get<StudentsPageResponse>(
      `/enrollments/course/${courseId}/students?page=${page}&limit=${limit}`,
      token,
    );
  },
};
