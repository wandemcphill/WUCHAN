import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult as PgQueryResult, QueryResultRow } from 'pg';

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

  async query<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
      const res: PgQueryResult<T> = await this.pool.query<T>(sql, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount || 0
      };
    } catch (error) {
      this.logger.error(`Database query failed: ${sql}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async insertOutboxEvent(event: {
    domain: string;
    action: string;
    actorId: string;
    payload: Record<string, any>;
  }) {
    const sql = `
      INSERT INTO public.outbox_events (domain, action, actor_id, payload, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;
    return this.query(sql, [event.domain, event.action, event.actorId, JSON.stringify(event.payload)]);
  }

  async insertAuditLog(log: {
    domain: string;
    action: string;
    actorId: string;
    organizationId?: string;
    resourceId?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
  }) {
    const sql = `
      INSERT INTO public.audit_logs (domain, action, actor_id, organization_id, resource_id, before_state, after_state)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    return this.query(sql, [
      log.domain,
      log.action,
      log.actorId,
      log.organizationId || null,
      log.resourceId || null,
      log.beforeState ? JSON.stringify(log.beforeState) : null,
      log.afterState ? JSON.stringify(log.afterState) : null
    ]);
  }
}
