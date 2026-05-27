import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type { Submission, SubmissionResult } from '../domain/submissions.types';

export const submissionsApi = {
  send(submission: Submission, token: string) {
    return apiClient.post('/submissions', submission, token);
  },

  getById(id: string, token: string): Promise<SubmissionResult> {
    return apiClient.get<SubmissionResult>(`/submissions/${id}`, token);
  },
};
