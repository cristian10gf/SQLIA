import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import { parseAiChallenge } from './create-challenge.parser';
import { parseAiSeedScript } from './generate-data.parser';

export const aiApi = {
  async generateChallenge(prompt: string, token: string) {
    const response = await apiClient.post(
      '/ai/generate-challenge',
      { prompt },
      token,
    );

    console.log('raw response from api: ', response);

    const dataObj =
      response && (response as any).data ? (response as any).data : response;

    const rawText = dataObj && dataObj.result ? dataObj.result : '';

    if (!rawText) {
      throw new Error(
        'No se pudo extraer la propiedad "result" de la respuesta de la IA.',
      );
    }

    return parseAiChallenge(String(rawText));
  },

  async generateRandomData(schema: string, prompt: string, token: string) {
    const response = await apiClient.post(
      '/ai/generate-data',
      { schema, prompt },
      token,
    );

    const dataObj =
      response && (response as any).data ? (response as any).data : response;

    const rawText =
      dataObj && dataObj.result
        ? dataObj.result
        : typeof dataObj === 'string'
          ? dataObj
          : '';

    if (!rawText) {
      throw new Error('No se pudo extraer el script SQL de la IA.');
    }

    return parseAiSeedScript(String(rawText));
  },
};
