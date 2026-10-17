import fs from 'fs';
import path from 'path';
import { Pool, PoolClient } from 'pg';
import { isSupabaseHost, migrationBlockedReason, poolOptionsFromDatabaseUrl, connectionParts } from './postgres-connection';

const ADVISORY_LOCK_KEY = 867530901;

const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`;

const VANILLA_AUTH_SQL = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;
GRANT authenticated TO CURRENT_USER;
`;

const APP_GRANTS_SQL = `
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
REVOKE ALL ON TABLE public.schema_migrations FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
`;

const VANILLA_AUTH_GRANTS_SQL = `
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
`;

export function usesHostedSupabaseAuth(connectionString: string): boolean {
  const parts = connectionParts(connectionString);
  return Boolean(parts && isSupabaseHost(parts.host));
}

export interface MigrationReport {
  applied: string[];
  skipped: string[];
  seeded: boolean;
}

export function shouldApplyMigrations(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'test' || env.APPLY_MIGRATIONS === 'false') return false;
  if (!env.DATABASE_URL) {
    if (env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production');
    }
    return false;
  }
  return true;
}

export function resolveSqlRoot(start: string): string {
  let dir = path.resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(dir, 'supabase', 'migrations'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not find supabase/migrations starting from ${start}`);
}

export function listMigrationFiles(migrationsDir: string): string[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => /^\d+.+\.sql$/.test(name))
    .sort((left, right) => left.localeCompare(right));
}

export async function applyMigrations(
  connectionString: string,
  sqlRoot = resolveSqlRoot(process.cwd())
): Promise<MigrationReport> {
  const migrationsDir = path.join(sqlRoot, 'supabase', 'migrations');
  const seedPath = path.join(sqlRoot, 'supabase', 'seed.sql');
  const files = listMigrationFiles(migrationsDir);
  if (files.length === 0) {
    throw new Error(`No migration files found in ${migrationsDir}`);
  }
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

  const blocked = migrationBlockedReason(connectionString);
  if (blocked) throw new Error(blocked);
  const hostedSupabase = usesHostedSupabaseAuth(connectionString);

  const pool = new Pool({
    ...poolOptionsFromDatabaseUrl(connectionString),
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  let client: PoolClient | undefined;
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    if (!hostedSupabase) {
      await client.query(VANILLA_AUTH_SQL);
    }
    await client.query(MIGRATION_TABLE_SQL);

    for (const filename of files) {
      const existing = await client.query(
        'SELECT 1 FROM public.schema_migrations WHERE filename = $1',
        [filename]
      );
      if ((existing.rowCount || 0) > 0) {
        skipped.push(filename);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      applied.push(filename);
      console.log(`Applied migration ${filename}`);
    }

    await client.query(APP_GRANTS_SQL);
    if (!hostedSupabase) {
      await client.query(VANILLA_AUTH_GRANTS_SQL);
    }
    await client.query(fs.readFileSync(seedPath, 'utf8'));
    console.log(`Migrations applied=${applied.length} skipped=${skipped.length}; seed executed`);
    return { applied, skipped, seeded: true };
  } finally {
    if (client) {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => undefined);
      client.release();
    }
    await pool.end();
  }
}

if (require.main === module) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  applyMigrations(connectionString).catch((error: unknown) => {
    console.error('Migration failed', error);
    process.exit(1);
  });
}
