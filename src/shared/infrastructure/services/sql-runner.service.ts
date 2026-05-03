import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Docker from 'dockerode';
import { Client } from 'pg';

@Injectable()
export class SqlRunnerService {
  private docker = new Docker(); // Busca el socket local

  async runValidation(schemaSql: string) {
    const container = await this.docker.createContainer({
      Image: 'postgres:15-alpine',
      Env: ['POSTGRES_PASSWORD=pass', 'POSTGRES_DB=test'],
      HostConfig: {
        AutoRemove: true,
        Memory: 512 * 1024 * 1024, // 512MB
        NanoCpus: 500000000, // 0.5 CPU
        PortBindings: {
          '5432/tcp': [{ HostPort: '0' }], // Pide un puerto libre
        },
      },
    });

    await container.start();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // IP del contenedor
    const inspect = await container.inspect();
    const hostPort = inspect.NetworkSettings.Ports['5432/tcp'][0].HostPort;

    try {
      await this.executeWithRetry('127.0.0.1', parseInt(hostPort), schemaSql);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException({
        message: 'Error en el esquema SQL',
        details: errorMessage,
      });
    } finally {
      await container.stop();
    }
  }

  private async executeWithRetry(
    host: string,
    port: number,
    sql: string,
    retries = 15,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      const client = new Client({
        host,
        port,
        user: 'postgres',
        password: 'pass',
        database: 'test',
        connectionTimeoutMillis: 2000,
      });

      try {
        await client.connect();
        await client.query(sql);
        await client.end();
        return;
      } catch (err) {
        const error = err as any;

        await client.end().catch(() => {});

        const isSqlSyntaxError =
          error.code && String(error.code).startsWith('42');

        if (!isSqlSyntaxError && i < retries - 1) {
          // Esperamos a Postgres
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }

        throw err;
      }
    }
    throw new InternalServerErrorException(
      'El Runner SQL no respondió a tiempo',
    );
  }
}
