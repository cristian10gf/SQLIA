import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client } from 'pg';
import type {
  ApplySchemaSeedInSchemaOptions,
  ExecuteQueryOptions,
  SqlConnectionParams,
  SqlSchemaFailureOrigin,
} from '../../../domain/interfaces/sql-execution.interface';
import { quoteSqlIdentifier } from './quote-sql-ident';

/** Operaciones síncronas contra Postgres vía `pg` (sin Docker). */
@Injectable()
export class PostgresSqlExecutor {
  async waitForPostgresReady(
    params: SqlConnectionParams,
    options?: { maxAttempts?: number },
  ): Promise<void> {
    const maxAttempts = options?.maxAttempts ?? 20;
    for (let i = 0; i < maxAttempts; i++) {
      const client = new Client({
        host: params.host,
        port: params.port,
        user: params.user,
        password: params.password,
        database: params.database,
        connectionTimeoutMillis: 2000,
      });
      try {
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        return;
      } catch {
        await client.end().catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    throw new InternalServerErrorException('Postgres no respondió a tiempo');
  }

  /** Contenedor efímero de validación: `public` limpio + DDL + semilla del profesor. */
  async applyFreshPublicSchema(
    params: SqlConnectionParams,
    schemaDefinition: string,
    seedScript?: string,
  ): Promise<void> {
    const client = new Client({
      host: params.host,
      port: params.port,
      user: params.user,
      password: params.password,
      database: params.database,
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    try {
      await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      try {
        await client.query(schemaDefinition);
      } catch (schemaErr) {
        (schemaErr as { origin?: SqlSchemaFailureOrigin }).origin = 'ESQUEMA';
        throw schemaErr;
      }
      if (seedScript) {
        try {
          await client.query(seedScript);
        } catch (seedErr) {
          (seedErr as { origin?: SqlSchemaFailureOrigin }).origin =
            'DATOS_INICIALES';
          throw seedErr;
        }
      }
    } finally {
      await client.end().catch(() => {});
    }
  }

  async applySchemaAndSeedInSchema(
    params: SqlConnectionParams,
    options: ApplySchemaSeedInSchemaOptions,
  ): Promise<void> {
    const client = new Client({
      host: params.host,
      port: params.port,
      user: params.user,
      password: params.password,
      database: params.database,
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    try {
      const schema = options.targetSchema;
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS ${quoteSqlIdentifier(schema)}`,
      );
      await client.query(
        `SET search_path TO ${quoteSqlIdentifier(schema)}, public`,
      );
      try {
        await client.query(options.schemaDefinition);
      } catch (schemaErr) {
        (schemaErr as { origin?: SqlSchemaFailureOrigin }).origin = 'ESQUEMA';
        throw schemaErr;
      }
      if (options.seedScript) {
        try {
          await client.query(options.seedScript);
        } catch (seedErr) {
          (seedErr as { origin?: SqlSchemaFailureOrigin }).origin =
            'DATOS_INICIALES';
          throw seedErr;
        }
      }
    } finally {
      await client.end().catch(() => {});
    }
  }

  async executeQueryWithTimeout(
    params: SqlConnectionParams,
    query: string,
    options: ExecuteQueryOptions,
  ): Promise<{ rows: unknown[]; durationMs: number }> {
    const client = new Client({
      host: params.host,
      port: params.port,
      user: params.user,
      password: params.password,
      database: params.database,
      connectionTimeoutMillis: Math.min(
        options.statementTimeoutMs + 2000,
        30000,
      ),
    });
    const started = performance.now();
    await client.connect();
    try {
      if (options.searchPathSchema) {
        await client.query(
          `SET search_path TO ${quoteSqlIdentifier(options.searchPathSchema)}, public`,
        );
      }
      await client.query(
        `SET statement_timeout TO ${Math.max(1, Math.floor(options.statementTimeoutMs))}`,
      );
      const res = await client.query(query);
      return {
        rows: res.rows as unknown[],
        durationMs: Math.round(performance.now() - started),
      };
    } finally {
      await client.query('RESET statement_timeout').catch(() => {});
      await client.end().catch(() => {});
    }
  }

  async executeScript(
    params: SqlConnectionParams,
    sql: string,
    options?: { searchPathSchema?: string },
  ): Promise<void> {
    const client = new Client({
      host: params.host,
      port: params.port,
      user: params.user,
      password: params.password,
      database: params.database,
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    try {
      if (options?.searchPathSchema) {
        await client.query(
          `SET search_path TO ${quoteSqlIdentifier(options.searchPathSchema)}, public`,
        );
      }
      await client.query(sql);
    } finally {
      await client.end().catch(() => {});
    }
  }

  async dropSchemaIfExists(
    params: SqlConnectionParams,
    schemaName: string,
  ): Promise<void> {
    const q = quoteSqlIdentifier(schemaName);
    await this.executeScript(params, `DROP SCHEMA IF EXISTS ${q} CASCADE`);
  }
}
