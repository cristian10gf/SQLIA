import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type { SandboxStatusValue, VisibleChallenge } from '../domain/evaluationChallenge.types';

export type SandboxInfo = {
  id: string;
  challengeId: string;
  status: SandboxStatusValue;
  dockerContainerName: string | null;
  hostPort: number | null;
  dbUser: string | null;
  dbName: string | null;
  connectionHost: string | null;
  expiresAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export const challengeApi = {
  create(payload: any, token: string) {
    return apiClient.post('/challenges', payload, token);
  },

  listByCourse(courseId: string, params: any, token: string) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/challenges/course/${courseId}?${query}`, token);
  },

  listByProfessor(professorId: string, params: any, token: string) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(
      `/challenges/professor/${professorId}?${query}`,
      token,
    );
  },

  findById(id: string, token: string) {
    return apiClient.get(`/challenges/${id}`, token);
  },

  update(id: string, payload: any, token: string) {
    return apiClient.patch(`/challenges/${id}`, payload, token);
  },

  remove(id: string, token: string) {
    return apiClient.delete(`/challenges/${id}`, token);
  },

  changeVisibility(id: string, visibility: string, token: string) {
    return apiClient.patch(
      `/challenges/${id}/visibility`,
      { visibility },
      token,
    );
  },

  getSandbox(id: string, token: string) {
    return apiClient.get<{ data: SandboxInfo | null }>(
      `/challenges/${id}/sandbox`,
      token,
    );
  },

  publish(id: string, token: string) {
    return apiClient.patch<{ message: string; jobId: string }>(
      `/challenges/${id}/publish`,
      {},
      token,
    );
  },

  provision(id: string, token: string) {
    return apiClient.post<{ message: string; jobId: string }>(
      `/challenges/${id}/sandbox/provision`,
      {},
      token,
    );
  },

  listVisibleByCourse(courseId: string, token: string, page = 1, limit = 10) {
    return apiClient.get<{ data: VisibleChallenge[]; total: number }>(
      `/challenges/course/${courseId}/visible?page=${page}&limit=${limit}`,
      token,
    );
  },
};
