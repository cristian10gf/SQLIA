import { apiClient } from '../../../shared/infrastructure/http/apiClient';

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
};
