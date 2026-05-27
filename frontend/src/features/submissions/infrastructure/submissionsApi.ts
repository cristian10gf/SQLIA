import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type { Submission, SubmissionResult, LeaderboardEntry } from '../domain/submissions.types';

export const submissionsApi = {
  send(submission: Submission, token: string) {
    return apiClient.post('/submissions', submission, token);
  },

  getById(id: string, token: string): Promise<SubmissionResult> {
    return apiClient.get<SubmissionResult>(`/submissions/${id}`, token);
  },

  getMyCount(evaluationId: string, token: string): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(`/submissions/my-count?evaluationId=${evaluationId}`, token);
  },

  getLeaderboard(evaluationId: string, token: string): Promise<LeaderboardEntry[]> {
    return apiClient.get<LeaderboardEntry[]>(`/submissions/leaderboard/${evaluationId}`, token);
  },
};
