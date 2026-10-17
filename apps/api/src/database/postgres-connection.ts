import { PoolConfig } from 'pg';

/**
 * Render's private-network Postgres host does not use TLS.
 * External hostnames (*.render.com) and sslmode=require do.
 * Local and loopback hosts stay unencrypted.
 */
export function postgresSsl(
  connectionString: string
): false | { rejectUnauthorized: false } {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return false;
  }

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase();

  if (sslmode === 'disable') return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (sslmode === 'require' || host.endsWith('.render.com')) {
    return { rejectUnauthorized: false };
  }
  return false;
}

export function poolOptionsFromDatabaseUrl(connectionString: string): PoolConfig {
  const ssl = postgresSsl(connectionString);
  return ssl ? { connectionString, ssl } : { connectionString };
}
