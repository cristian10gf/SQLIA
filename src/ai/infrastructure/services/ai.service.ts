import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAiProvider } from '../../../ai/domain/repositories/ai-provider.repository';

@Injectable()
export class AiService implements IAiProvider {
  private readonly logger = new Logger(AiService.name);

  private get apiUrl(): string {
    return `${process.env.AI_URL}/chat/completions`;
  }

  async getOptimizationTips(query: string, results: string): Promise<string> {
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
            'Eres un experto en SQL. Analiza la consulta SQL y sus resultados obtenidos (resultados en formato JSON). Luego, responde en texto plano, natural y conciso: La consulta es correcta/incorrecta y da recomendaciones de corrección u optimización.',
        },
        {
          role: 'user',
          content: `Consulta: ${query}\nResultados: ${results}`,
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

      throw new Error('La API respondió sin contenido');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }

  async generateRandomData(schema: string, prompt: string): Promise<string> {
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
            'Analiza el esquema SQL. Luego genera un script SQL para introducir datos de prueba en este esquema basado en su estructura y el nombre de sus tablas y columnas. Es posible que se se envíen instrucciones adicionales para indicarte: Cantidad de registros por tabla, Rangos de fechas, Valores mínimos y máximos para campos numéricos, Listas de valores posibles para campos tipo texto, Porcentaje de valores nulos permitidos, Relaciones entre tablas mediante llaves foráneas o Casos borde para validar consultas.',
        },
        {
          role: 'user',
          content: `Esquema: ${schema}\nInstrucciones: ${prompt}`,
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

      throw new Error('La API respondió sin contenido');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }

  async generateChallenge(prompt: string): Promise<string> {
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
            'Eres un profesor de SQL, lee las instrucciones y a partir de estas, genera un reto SQL. Escribelo en este formato:\title: Texto\description: Texto\difficulty: EASY, MEDIUM o HARD\visibility: PUBLIC\ndatabase_engine: PostgreSQL\nschema_definition: Script SQL de creación de tablas para el reto (CREATE ...)\nseed_script: (Vacío)\nexpected_result: JSON con resultados esperados\ntime_limit_ms: Milisegundos esperados para la duración de la consulta (solo número)',
        },
        {
          role: 'user',
          content: `Instrucciones: ${prompt}`,
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

      throw new Error('La API respondió sin contenido');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }
}
