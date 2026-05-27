import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type { Submission } from '../domain/submissions.types';

export const submissionsApi = {
  send(submission: Submission, token: string) {
    console.log(submission, token);
    return apiClient.post('/submissions', submission, token);
  },
};
