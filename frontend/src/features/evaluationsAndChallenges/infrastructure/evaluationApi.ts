import { apiClient } from '../../../shared/infrastructure/http/apiClient';

export const evaluationApi = {
  create(payload: any, token: string) {
    return apiClient.post('/evaluations', payload, token);
  },

  listForProfessor(
    courseId: string,
    params: { page?: number; limit?: number; visibility?: string },
    token: string,
  ) {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get(`/evaluations/course/${courseId}?${query}`, token);
  },

  listVisibleForStudent(courseId: string, page = 1, limit = 10, token: string) {
    return apiClient.get(
      `/evaluations/course/${courseId}/visible?page=${page}&limit=${limit}`,
      token,
    );
  },

  findById(id: string, token: string) {
    return apiClient.get(`/evaluations/${id}`, token);
  },

  update(id: string, payload: any, token: string) {
    return apiClient.patch(`/evaluations/${id}`, payload, token);
  },

  changeVisibility(id: string, isVisible: boolean, token: string) {
    return apiClient.patch(
      `/evaluations/${id}/change-visibility`,
      { isVisible },
      token,
    );
  },

  remove(id: string, token: string) {
    return apiClient.delete(`/evaluations/${id}`, token);
  },
};
