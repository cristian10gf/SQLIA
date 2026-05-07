import { apiClient } from '../../../shared/infrastructure/http/apiClient';

export const evaluationChallengeApi = {
  associate(
    payload: {
      evaluationId: string;
      challengeId: string;
      points: number;
      orderIndex: number;
    },
    token: string,
  ) {
    return apiClient.post('/evaluation-challenges', payload, token);
  },

  listByEvaluation(evaluationId: string, params: any, token: string) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(
      `/evaluation-challenges/evaluation/${evaluationId}?${query}`,
      token,
    );
  },

  updateAssociation(
    evaluationId: string,
    challengeId: string,
    payload: any,
    token: string,
  ) {
    return apiClient.patch(
      `/evaluation-challenges/${evaluationId}/${challengeId}`,
      payload,
      token,
    );
  },

  removeAssociation(evaluationId: string, challengeId: string, token: string) {
    return apiClient.delete(
      `/evaluation-challenges/${evaluationId}/${challengeId}`,
      token,
    );
  },
};
