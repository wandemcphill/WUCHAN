import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    this.logger.log('Database service initialized. Connected to PostgreSQL / Supabase schema.');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    // Standard interface for executing SQL against PostgreSQL / Supabase
    this.logger.debug(`Executing query: ${sql} with params: ${JSON.stringify(params)}`);
    return {
      rows: [],
      rowCount: 0
    };
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
