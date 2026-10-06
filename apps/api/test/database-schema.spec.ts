import * as fs from 'fs';
import * as path from 'path';

describe('Database Schema & RLS Policies Test Suite', () => {
  const migrationsDir = path.join(__dirname, '..', '..', '..', 'supabase', 'migrations');

  it('contains initial schema with profiles, organizations, and memberships', () => {
    const file = path.join(migrationsDir, '00001_initial_schema.sql');
    const sql = fs.readFileSync(file, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.organizations');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.organization_members');
    expect(sql).toContain('org_type AS ENUM');
    expect(sql).toContain('role_name AS ENUM');
  });

  it('enforces money integrity with integer cents in domain tables', () => {
    const file = path.join(migrationsDir, '00002_domain_tables.sql');
    const sql = fs.readFileSync(file, 'utf8');

    expect(sql).toContain('base_price_cents BIGINT NOT NULL CHECK (base_price_cents >= 0)');
    expect(sql).toContain('total_cents BIGINT NOT NULL CHECK (total_cents >= 0)');
    expect(sql).toContain('total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents >= 0)');
    expect(sql).toContain('amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0)');
    expect(sql).not.toContain('base_price DOUBLE');
  });

  it('enables Row Level Security (RLS) and defines isolation policies', () => {
    const file = path.join(migrationsDir, '00003_rls_policies.sql');
    const sql = fs.readFileSync(file, 'utf8');

    expect(sql).toContain('ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_org_member');
    expect(sql).toContain('CREATE POLICY "Organizations select" ON public.organizations FOR SELECT');
  });
});
