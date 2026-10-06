-- 00001_initial_schema.sql
-- WUCHAN Database Foundation: Multi-Tenant Core (Organizations, Users, Roles, Permissions)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE org_type AS ENUM ('CUSTOMER', 'FACTORY', 'PLATFORM');
CREATE TYPE role_name AS ENUM (
  'PLATFORM_ADMIN',
  'ORG_OWNER',
  'ORG_ADMIN',
  'FACTORY_MANAGER',
  'PRODUCTION_SUPERVISOR',
  'QUALITY_INSPECTOR',
  'CUSTOMER_BUYER',
  'CUSTOMER_PROJECT_MANAGER',
  'MEMBER'
);

-- Users Profile (Linked to supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type org_type NOT NULL,
  logo_url TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Memberships
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role role_name NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Index for multi-tenant query speed
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
