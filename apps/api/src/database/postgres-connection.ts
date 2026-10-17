import { PoolConfig } from 'pg';

export interface ConnectionParts {
  host: string;
  port: string;
}

/**
 * Render's private-network Postgres host does not use TLS.
 * External Render hosts, Supabase hosts, and sslmode=require do.
 * Local and loopback hosts stay unencrypted.
 */
export function connectionParts(connectionString: string): ConnectionParts | null {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return null;
  }
  return {
    host: url.hostname.replace(/^\[|\]$/g, '').toLowerCase(),
    port: url.port,
  };
}

export function isSupabaseHost(host: string): boolean {
  return host === 'supabase.co' || host.endsWith('.supabase.co') || host.endsWith('.supabase.com');
}

export function postgresSsl(
  connectionString: string
): false | { rejectUnauthorized: false } {
  const parts = connectionParts(connectionString);
  if (!parts) return false;

  let sslmode = '';
  try {
    sslmode = (new URL(connectionString).searchParams.get('sslmode') || '').toLowerCase();
  } catch {
    sslmode = '';
  }

  if (sslmode === 'disable') return false;
  if (parts.host === 'localhost' || parts.host === '127.0.0.1' || parts.host === '::1') return false;
  if (sslmode === 'require' || parts.host.endsWith('.render.com') || isSupabaseHost(parts.host)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

/**
 * Supabase's transaction pooler (port 6543) drops session state.
 * Migrations, advisory locks, and SET ROLE need the session pooler on port 5432.
 */
export function migrationBlockedReason(connectionString: string): string | null {
  const parts = connectionParts(connectionString);
  if (!parts) return null;
  if (isSupabaseHost(parts.host) && parts.port === '6543') {
    return 'Supabase transaction pooler port 6543 cannot run migrations or SET ROLE. Use the session pooler on port 5432.';
  }
  return null;
}

export function poolOptionsFromDatabaseUrl(connectionString: string): PoolConfig {
  const ssl = postgresSsl(connectionString);
  return ssl ? { connectionString, ssl } : { connectionString };
}
