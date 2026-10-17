import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  listMigrationFiles,
  resolveSqlRoot,
  shouldApplyMigrations,
} from '../src/database/apply-migrations';
import { migrationBlockedReason, postgresSsl } from '../src/database/postgres-connection';
import { usesHostedSupabaseAuth } from '../src/database/apply-migrations';

describe('Render Postgres connection', () => {
  it('leaves local and private-network hosts unencrypted', () => {
    expect(postgresSsl('postgresql://postgres:postgres@localhost:5432/wuchan')).toBe(false);
    expect(postgresSsl('postgresql://postgres:postgres@127.0.0.1:5432/wuchan')).toBe(false);
    expect(postgresSsl('postgresql://postgres:postgres@[::1]:5432/wuchan')).toBe(false);
    expect(postgresSsl('postgresql://user:pw@dpg-abc-a/wuchan')).toBe(false);
    expect(postgresSsl('not a url')).toBe(false);
  });

  it('enables TLS for external Render hosts, Supabase, and sslmode=require', () => {
    expect(postgresSsl('postgresql://user:pw@dpg-abc-a.oregon-postgres.render.com/wuchan')).toEqual({
      rejectUnauthorized: false,
    });
    expect(postgresSsl('postgresql://user:pw@dpg-abc-a/wuchan?sslmode=require')).toEqual({
      rejectUnauthorized: false,
    });
    expect(postgresSsl('postgresql://postgres:pw@db.example.supabase.co:5432/postgres')).toEqual({
      rejectUnauthorized: false,
    });
    expect(postgresSsl('postgresql://postgres.example:pw@aws-1-eu-west-2.pooler.supabase.com:5432/postgres')).toEqual({
      rejectUnauthorized: false,
    });
  });

  it('rejects the Supabase transaction pooler for migrations and keeps hosted auth', () => {
    const session = 'postgresql://postgres.example:pw@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';
    const transaction = 'postgresql://postgres.example:pw@aws-1-eu-west-2.pooler.supabase.com:6543/postgres';
    expect(migrationBlockedReason(session)).toBeNull();
    expect(migrationBlockedReason(transaction)).toMatch(/6543/);
    expect(usesHostedSupabaseAuth(session)).toBe(true);
    expect(usesHostedSupabaseAuth('postgresql://postgres:postgres@127.0.0.1:5432/wuchan')).toBe(false);
  });

  it('honors sslmode=disable even on an external Render host', () => {
    expect(
      postgresSsl('postgresql://user:pw@dpg-abc-a.oregon-postgres.render.com/wuchan?sslmode=disable')
    ).toBe(false);
  });
});

describe('migration runner decisions', () => {
  it('skips tests and explicit opt-out, and requires DATABASE_URL in production', () => {
    expect(shouldApplyMigrations({ NODE_ENV: 'test', DATABASE_URL: 'postgres://db' })).toBe(false);
    expect(shouldApplyMigrations({ NODE_ENV: 'production', APPLY_MIGRATIONS: 'false', DATABASE_URL: 'postgres://db' })).toBe(false);
    expect(shouldApplyMigrations({ NODE_ENV: 'development' })).toBe(false);
    expect(shouldApplyMigrations({ NODE_ENV: 'production', DATABASE_URL: 'postgres://db' })).toBe(true);
    expect(() => shouldApplyMigrations({ NODE_ENV: 'production' })).toThrow('DATABASE_URL is required in production');
  });

  it('finds the repo SQL root and lists numbered migration files in order', () => {
    const root = resolveSqlRoot(__dirname);
    const files = listMigrationFiles(path.join(root, 'supabase', 'migrations'));
    expect(files[0]).toBe('00001_initial_schema.sql');
    expect(files[files.length - 1]).toBe('00010_contract_order_handoff.sql');
    expect(files).toHaveLength(9);

    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wuchan-sql-'));
    fs.mkdirSync(path.join(temp, 'nested', 'supabase', 'migrations'), { recursive: true });
    expect(resolveSqlRoot(path.join(temp, 'nested', 'deeper'))).toBe(path.join(temp, 'nested'));
  });
});
