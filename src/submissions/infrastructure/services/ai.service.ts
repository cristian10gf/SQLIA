import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAiProvider } from '../../domain/interfaces/ai-provider.interface';

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
      model: 'deepseek-ai/deepseek-v4-pro',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en SQL. Analiza el esquema y la consulta SQL. Luego, indica si la consulta es correcta y da recomendaciones de optimización. Responde de forma muy concisa y breve.',
        },
        {
          role: 'user',
          content: `Esquema: ${schema}\nConsulta: ${query}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
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
