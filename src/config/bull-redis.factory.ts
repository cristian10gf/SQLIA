import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

/** Opciones recomendadas por BullMQ para cliente bloqueante. */
const bullRedisDefaults: Partial<RedisOptions> = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/**
 * Construye la opción `connection` de BullMQ desde variables de entorno.
 * Prioridad: `REDIS_URL` → host/puerto/usuario/contraseña/TLS opcional.
 */
export function createBullRedisConnection(config: ConfigService): RedisOptions {
  const url = config.get<string>('REDIS_URL')?.trim();
  if (url) {
    return { ...bullRedisDefaults };
  }

  const portRaw = config.get<string>('REDIS_PORT', '6379');
  const port = Number.parseInt(portRaw, 10);

  const connection: RedisOptions = {
    ...bullRedisDefaults,
    host: config.get<string>('REDIS_HOST', 'localhost'),
    port: Number.isFinite(port) ? port : 6379,
  };

  const password = config.get<string>('REDIS_PASSWORD');
  if (password) {
    connection.password = password;
  }

  const username = config.get<string>('REDIS_USERNAME');
  if (username) {
    connection.username = username;
  }

  const tlsFlag = config.get<string>('REDIS_TLS');
  if (tlsFlag === 'true' || tlsFlag === '1') {
    const rejectUnauthorizedRaw = config.get<string>(
      'REDIS_TLS_REJECT_UNAUTHORIZED',
      'true',
    );
    connection.tls =
      rejectUnauthorizedRaw === 'false' || rejectUnauthorizedRaw === '0'
        ? { rejectUnauthorized: false }
        : {};
  }

  return connection;
}
