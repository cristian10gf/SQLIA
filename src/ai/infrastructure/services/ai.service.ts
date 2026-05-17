import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAiProvider } from '../../../ai/domain/repositories/ai-provider.repository';

@Injectable()
export class AiService implements IAiProvider {
  private readonly logger = new Logger(AiService.name);

  private get apiUrl(): string {
    return `${process.env.AI_URL}/chat/completions`;
  }

  async getOptimizationTips(query: string, schema: string): Promise<string> {
    const apiHeaders = {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const requestPayload = {
      model: 'mistralai/mistral-medium-3.5-128b',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en SQL. Analiza el esquema y la consulta SQL. Luego, responde en texto plano, natural, sin negrita y conciso: La consulta es correcta/incorrecta y da recomendaciones de corrección u optimización.',
        },
        {
          role: 'user',
          content: `Esquema: ${schema}\nConsulta: ${query}`,
        },
      ],
      reasoning_effort: 'none',
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 500,
      stream: false,
    };

    try {
      this.logger.log(
        `Iniciando análisis con el modelo: ${requestPayload.model}`,
      );

      const response = await axios.post(this.apiUrl, requestPayload, {
        headers: apiHeaders,
        timeout: 60000,
      });

      if (response.data?.choices?.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('La API respondió sin contenido en "choices"');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }
}
