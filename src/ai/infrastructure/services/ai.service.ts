import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAiProvider } from '../../../ai/domain/repositories/ai-provider.repository';

@Injectable()
export class AiService implements IAiProvider {
  private readonly logger = new Logger(AiService.name);

  private get apiUrl(): string {
    return `${process.env.AI_URL}/chat/completions`;
  }

  async getOptimizationTips(
    query: string,
    expected: string,
    results: string,
  ): Promise<string> {
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
            'Eres un experto en SQL. Analiza la consulta SQL, sus resultados esperados y los resultados reales, ignora la difencia de formatos entre los resultados esperados y los reales, evalua solo el contenido y no menciones esta diferencia en tu respuesta. Si los resultados contienen un campo "error" con un mensaje de error de base de datos y un campo "status", significa que la consulta falló con ese error; en ese caso basa tu calificación y recomendaciones en el error reportado, no asumas que las tablas no existen. Responde en texto plano, sin negrita, natural y conciso. La primera línea debe tener solo un número del 1 al 100 que representa la calificación. Luego da recomendaciones de corrección u optimización.',
        },
        {
          role: 'user',
          content: `Consulta: ${query}\n Resultados esperados: ${JSON.stringify(expected)}\nResultados reales: ${JSON.stringify(results)}`,
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

  async generateRandomData(
    schema: string,
    prompt: string,
  ): Promise<{ result: string }> {
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
            'Analiza el esquema SQL. Luego genera un script SQL para introducir datos semi realistas de prueba en este esquema basado en su estructura y el nombre de sus tablas y columnas. Es posible que se se envíen instrucciones adicionales para indicarte: Cantidad de registros por tabla, Rangos de fechas, Valores mínimos y máximos para campos numéricos, Listas de valores posibles para campos tipo texto, Porcentaje de valores nulos permitidos, Relaciones entre tablas mediante llaves foráneas o Casos borde para validar consultas. Responde únicamente con el script SQL en texto plano sin envolverlo en ```sql ```',
        },
        {
          role: 'user',
          content: `Esquema: ${schema}\nInstrucciones: ${prompt}`,
        },
      ],
      reasoning_effort: 'none',
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 5000,
      stream: false,
    };

    try {
      this.logger.log(
        `Iniciando análisis con el modelo: ${requestPayload.model}`,
      );

      const response = await axios.post(this.apiUrl, requestPayload, {
        headers: apiHeaders,
        timeout: 300000,
      });

      if (response.data?.choices?.length > 0) {
        return { result: response.data.choices[0].message.content };
      }

      throw new Error('La API respondió sin contenido');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }

  async generateChallenge(prompt: string): Promise<{ result: string }> {
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
            'Eres un profesor de SQL, lee las instrucciones y a partir de estas, genera un reto SQL. Escribelo en texto plano con este formato sin añadir u omitir ningun detalle (no uses saltos de linea con backslash n dentro de los campos):\n' +
            'title: Texto\n' +
            'description: Instrucciones para el reto\n' +
            'difficulty: EASY, MEDIUM o HARD\n' +
            'visibility: PUBLIC\n' +
            'database_engine: PostgreSQL\n' +
            'schema_definition: Script SQL de creación de tablas para el reto (ejemplo: CREATE ...), puedes crear una o varias tablas\n' +
            'seed_script: Script INSERT con datos iniciales del reto, que la suma del numero de registros entre todas las tablas sea al menos 50\n' +
            'expected_result: Un objeto JSON único (NO uses corchetes de Array [] en la raíz, usa llaves {} en la raíz) que contenga una propiedad "data" cuyo valor sea la lista de registros obtenidos de la consulta SELECT. Ejemplo exacto: {"data": [{"columna1": "valor", "columna2": 10}, {"columna1": "valor2", "columna2": 20}]}\n' +
            'time_limit_ms: Milisegundos esperados para la duración de la consulta (solo número, mínimo 500)',
        },
        {
          role: 'user',
          content: `Instrucciones: ${prompt}`,
        },
      ],
      reasoning_effort: 'none',
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 3000,
      stream: false,
    };

    try {
      this.logger.log(
        `Iniciando análisis con el modelo: ${requestPayload.model}`,
      );

      const response = await axios.post(this.apiUrl, requestPayload, {
        headers: apiHeaders,
        timeout: 300000,
      });

      if (response.data?.choices?.length > 0) {
        return { result: response.data.choices[0].message.content };
      }

      throw new Error('La API respondió sin contenido');
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error('Error en AiService:', JSON.stringify(errorData));

      throw new Error(`Fallo en el Asistente IA: ${error.message}`);
    }
  }
}
