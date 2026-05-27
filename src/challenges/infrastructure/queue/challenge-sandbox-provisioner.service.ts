import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Docker from 'dockerode';
import { randomBytes } from 'crypto';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { CHALLENGE_SANDBOX_REPOSITORY } from '../../domain/repositories/challenge-sandbox.repository.interface';
import type { IChallengeSandboxRepository } from '../../domain/repositories/challenge-sandbox.repository.interface';
import { SQL_EXECUTION_PORT } from '../../../shared/domain/interfaces/sql-execution.tokens';
import type { ISqlExecutionPort } from '../../../shared/domain/interfaces/sql-execution.interface';
import {
  CHALLENGE_ARCHIVE_ON_SANDBOX_TEARDOWN_COMMAND,
  CHALLENGE_SANDBOX_EXPIRES_AT_QUERY,
} from '../../domain/interfaces/challenge-provisioning.tokens';
import type { IChallengeArchiveOnSandboxTeardownCommand } from '../../domain/interfaces/challenge-archive-on-sandbox-teardown.command.interface';
import type { IChallengeSandboxExpiresAtQuery } from '../../domain/interfaces/challenge-sandbox-expires-at.query.interface';
import { challengeSandboxDeferredTeardownOpts } from '../../../shared/infrastructure/queue/bull-job-options.presets';

export type ChallengeSandboxJob =
  | { action: 'provision'; challengeId: string }
  | { action: 'teardown'; challengeId: string };

@Injectable()
export class ChallengeSandboxProvisioner {
  private readonly logger = new Logger(ChallengeSandboxProvisioner.name);
  private readonly docker = new Docker();

  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: IChallengeRepository,
    @Inject(CHALLENGE_SANDBOX_REPOSITORY)
    private readonly sandboxes: IChallengeSandboxRepository,
    @Inject(SQL_EXECUTION_PORT) private readonly sqlRunner: ISqlExecutionPort,
    @Inject(CHALLENGE_SANDBOX_EXPIRES_AT_QUERY)
    private readonly expiresAtQuery: IChallengeSandboxExpiresAtQuery,
    @Inject(CHALLENGE_ARCHIVE_ON_SANDBOX_TEARDOWN_COMMAND)
    private readonly archiveOnTeardown: IChallengeArchiveOnSandboxTeardownCommand,
    @InjectQueue('challenge-sandbox') private readonly sandboxQueue: Queue,
  ) {}

  async provision(challengeId: string): Promise<void> {
    const challenge = await this.challenges.findById(challengeId);
    if (!challenge) {
      this.logger.warn(`provision: reto no encontrado ${challengeId}`);
      return;
    }

    let row = await this.sandboxes.findByChallengeId(challengeId);
    if (!row) {
      row = await this.sandboxes.findOrCreatePending(challengeId);
    }
    if (row.status === 'READY' && row.dockerContainerName && row.hostPort) {
      this.logger.log(`provision: sandbox ya READY ${challengeId}`);
      return;
    }

    const expiresAt = await this.expiresAtQuery.resolveExpiresAt(challengeId);
    await this.sandboxes.updateByChallengeId(challengeId, {
      status: 'PROVISIONING',
      lastError: null,
      expiresAt,
    });

    const containerName = `sqlia-challenge-${challengeId}`;
    const dbPassword = randomBytes(12).toString('base64url');
    const dbName = 'sqlia_challenge';
    const dbUser = 'postgres';
    const image = this.sqlRunner.resolveRunnerImage();
    const limits = this.sqlRunner.dockerResourceLimits();

    let hostPort: string | undefined;

    try {
      const existing = this.docker.getContainer(containerName);
      const exists = await existing.inspect().then(
        () => true,
        () => false,
      );
      if (exists) {
        await existing.remove({ force: true }).catch(() => {});
      }

      const container = await this.docker.createContainer({
        name: containerName,
        Image: image,
        Env: [`POSTGRES_PASSWORD=${dbPassword}`, `POSTGRES_DB=${dbName}`],
        HostConfig: {
          AutoRemove: false,
          Memory: limits.Memory,
          NanoCpus: limits.NanoCpus,
          PortBindings: { '5432/tcp': [{ HostPort: '0' }] },
        },
      });

      await container.start();
      await new Promise((r) => setTimeout(r, 2000));
      const inspect = await container.inspect();
      hostPort = inspect.NetworkSettings.Ports['5432/tcp']?.[0]?.HostPort;
      if (!hostPort) {
        throw new Error('No se obtuvo hostPort del contenedor sandbox');
      }

      const connectionHost = process.env.SQL_SANDBOX_DB_HOST || '127.0.0.1';
      const params = {
        host: connectionHost,
        port: parseInt(hostPort, 10),
        user: dbUser,
        password: dbPassword,
        database: dbName,
      };

      await this.sqlRunner.waitForPostgresReady(params);
      await this.sqlRunner.applySchemaAndSeedInSchema(params, {
        targetSchema: 'challenge_base',
        schemaDefinition: challenge.schemaDefinition,
        seedScript: challenge.seedScript,
      });

      await this.sandboxes.updateByChallengeId(challengeId, {
        status: 'READY',
        dockerContainerName: containerName,
        hostPort: parseInt(hostPort, 10),
        dbUser,
        dbPassword,
        dbName,
        connectionHost,
        expiresAt,
        lastError: null,
      });

      const delay = Math.max(0, expiresAt.getTime() - Date.now());
      await this.sandboxQueue.add(
        'teardown',
        { action: 'teardown', challengeId } satisfies ChallengeSandboxJob,
        challengeSandboxDeferredTeardownOpts(challengeId, delay),
      );
      this.logger.log(`provision OK ${challengeId}, teardown en ${delay}ms`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`provision falló ${challengeId}: ${msg}`);
      await this.sandboxes.updateByChallengeId(challengeId, {
        status: 'ERROR',
        lastError: msg,
      });
      try {
        const c = this.docker.getContainer(containerName);
        await c.remove({ force: true });
      } catch {
        /* ignore */
      }
      throw e;
    }
  }

  /** Limpia contenedor parcial y marca ERROR cuando PROVISIONING quedó colgado (cron / mantenimiento). */
  async recoverStaleProvisioning(challengeId: string): Promise<void> {
    const containerName = `sqlia-challenge-${challengeId}`;
    try {
      const c = this.docker.getContainer(containerName);
      await c.remove({ force: true });
    } catch {
      /* contenedor inexistente o ya limpio */
    }
    await this.sandboxes.updateByChallengeId(challengeId, {
      status: 'ERROR',
      lastError:
        'Aprovisionamiento excedió el tiempo esperado (recuperación automática).',
    });
  }

  /**
   * Cierra el contenedor sandbox y marca el sandbox EXPIRED.
   * El reto pasa a ARCHIVED solo al finalizar este flujo (no al vencer `expiresAt`).
   * Si Docker falla al detener/eliminar, el sandbox queda EXPIRED igualmente; el reto
   * se archiva porque el teardown ya se ejecutó (posible contenedor huérfano → mantenimiento).
   */
  async teardown(challengeId: string): Promise<void> {
    const row = await this.sandboxes.findByChallengeId(challengeId);
    if (!row) {
      return;
    }
    if (row.status === 'EXPIRED') {
      await this.archiveOnTeardown.archiveChallengeOnSandboxTeardown(
        challengeId,
      );
      return;
    }
    if (row.dockerContainerName) {
      try {
        const c = this.docker.getContainer(row.dockerContainerName);
        await c.stop({ t: 2 }).catch(() => {});
        await c.remove({ force: true }).catch(() => {});
      } catch (e) {
        this.logger.warn(`teardown docker ${challengeId}: ${e}`);
      }
    }
    await this.sandboxes.updateByChallengeId(challengeId, {
      status: 'EXPIRED',
      dockerContainerName: null,
      hostPort: null,
      dbPassword: null,
      lastError: null,
    });
    await this.archiveOnTeardown.archiveChallengeOnSandboxTeardown(challengeId);
  }
}
