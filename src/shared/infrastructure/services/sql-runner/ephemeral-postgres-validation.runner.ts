import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Docker from 'dockerode';
import type {
  SqlConnectionParams,
  SqlSchemaFailureOrigin,
} from '../../../domain/interfaces/sql-execution.interface';
import { PostgresSqlExecutor } from './postgres-sql.executor';
import {
  resolveDockerMemoryBytes,
  resolveDockerNanoCpus,
  resolveSqlRunnerImage,
} from './sql-runner-environment';

/**
 * Valida DDL/semilla del profesor en un contenedor Postgres efímero (AutoRemove).
 */
@Injectable()
export class EphemeralPostgresValidationRunner {
  private readonly docker = new Docker();

  constructor(private readonly postgres: PostgresSqlExecutor) {}

  async runValidation(
    schemaDefinition: string,
    seedScript?: string | null,
  ): Promise<void> {
    const dbPassword = 'pass';
    const dbName = 'test';
    const container = await this.docker.createContainer({
      Image: resolveSqlRunnerImage(),
      Env: [`POSTGRES_PASSWORD=${dbPassword}`, `POSTGRES_DB=${dbName}`],
      HostConfig: {
        AutoRemove: true,
        Memory: resolveDockerMemoryBytes(),
        NanoCpus: resolveDockerNanoCpus(),
        PortBindings: {
          '5432/tcp': [{ HostPort: '0' }],
        },
      },
    });

    await container.start();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const inspect = await container.inspect();
    const hostPort = inspect.NetworkSettings.Ports['5432/tcp']?.[0]?.HostPort;
    if (!hostPort) {
      await this.safeStopRemove(container);
      throw new InternalServerErrorException(
        'No se pudo obtener el puerto del contenedor de validación',
      );
    }

    const params: SqlConnectionParams = {
      host: '127.0.0.1',
      port: parseInt(hostPort, 10),
      user: 'postgres',
      password: dbPassword,
      database: dbName,
    };

    try {
      await this.postgres.waitForPostgresReady(params);
      await this.postgres.applyFreshPublicSchema(
        params,
        schemaDefinition,
        seedScript ?? undefined,
      );
    } catch (error) {
      const origin =
        (error as { origin?: SqlSchemaFailureOrigin }).origin ?? 'SISTEMA';
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException({
        message: `Error detectado en: ${origin}`,
        details: errorMessage,
      });
    } finally {
      await this.safeStopRemove(container);
    }
  }

  private async safeStopRemove(container: Docker.Container) {
    try {
      const state = await container.inspect();
      if (state.State.Running) {
        await container.stop({ t: 0 }).catch(() => {});
      }
      await container.remove({ force: true }).catch(() => {});
    } catch {
      /* ignore */
    }
  }
}
