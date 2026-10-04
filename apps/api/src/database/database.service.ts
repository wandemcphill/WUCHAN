import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult as PgQueryResult, QueryResultRow } from 'pg';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  onModuleInit() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/wuchan';

    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.logger.log('DatabaseService initialized with PostgreSQL connection pool.');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T extends QueryResultRow = any>(
    sql: string,
    params: any[] = [],
    userId?: string
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      if (userId) {
        await client.query('BEGIN');
        await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId]);
        const res: PgQueryResult<T> = await client.query<T>(sql, params);
        await client.query('COMMIT');
        return {
          rows: res.rows,
          rowCount: res.rowCount || 0
        };
      } else {
        const res: PgQueryResult<T> = await client.query<T>(sql, params);
        return {
          rows: res.rows,
          rowCount: res.rowCount || 0
        };
      }
    } catch (error) {
      if (userId) {
        await client.query('ROLLBACK').catch(() => {});
      }
      this.logger.error(`Database query failed: ${sql}`, error instanceof Error ? error.stack : String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  async withTransaction<T>(
    fn: (client: PoolClient) => Promise<T>,
    userId?: string
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (userId) {
        await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId]);
      }
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back due to error:', error instanceof Error ? error.stack : String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  async insertOutboxEvent(event: {
    domain: string;
    action: string;
    actorId: string;
    payload: Record<string, any>;
  }, client?: PoolClient) {
    const sql = `
      INSERT INTO public.outbox_events (domain, action, actor_id, payload, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;
    const params = [event.domain, event.action, event.actorId, JSON.stringify(event.payload)];
    if (client) {
      return client.query(sql, params);
    }
    return this.query(sql, params);
  }

  async insertAuditLog(log: {
    domain: string;
    action: string;
    actorId: string;
    organizationId?: string;
    resourceId?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
  }, client?: PoolClient) {
    const sql = `
      INSERT INTO public.audit_logs (domain, action, actor_id, organization_id, resource_id, before_state, after_state)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const params = [
      log.domain,
      log.action,
      log.actorId,
      log.organizationId || null,
      log.resourceId || null,
      log.beforeState ? JSON.stringify(log.beforeState) : null,
      log.afterState ? JSON.stringify(log.afterState) : null
    ];
    if (client) {
      return client.query(sql, params);
    }
    return this.query(sql, params);
  }
}
