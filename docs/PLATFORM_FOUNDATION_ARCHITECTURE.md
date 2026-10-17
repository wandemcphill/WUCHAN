# WUCHAN Platform Foundation Architecture & Implementation Note

## 1. Overview & Strategy

This document details the decisions and architecture for the **Platform Foundation** lane of WUCHAN. The platform foundation establishes the monorepo structure, database schemas and migrations, core authentication and multi-tenant RBAC authorization model, shared API contracts/validation, transactional outbox & event audit/notification framework, error conventions, and CI/test setup.

---

## 2. Monorepo Architecture

The repository is organized using `pnpm` workspaces:

```
.
├── apps/
│   ├── web/         # Next.js Application Foundation (App Router, Supabase Auth SSR helper, API client)
│   ├── api/         # NestJS REST API Monolith (Domain modules, Auth/RBAC guards, Exception filters, Outbox)
│   └── worker/      # Async Worker Service (Outbox consumer, background notification & audit processor)
├── packages/
│   ├── contracts/   # Shared API contracts, domain enums, state machine definitions, response interfaces
│   └── validation/  # Shared Zod validation schemas for all domain entities
├── supabase/
│   ├── migrations/  # Idempotent PostgreSQL SQL migrations (Tables, RLS policies, Indexes, Triggers)
│   └── seed.sql     # Seed data strategy for local dev & testing
└── .github/
    └── workflows/
        └── ci.yml   # Workflows for typecheck, lint, test, build, and migration verification
```

---

## 3. Database & Supabase Integration

### Tenant & Multi-Tenancy Strategy
- All tenant-bound entities include an `organization_id` foreign key.
- Row Level Security (RLS) is enabled on all sensitive tenant tables.
- RLS policies restrict operations based on current user JWT claims or session contexts (`auth.uid()` and organization membership).

### Financial Integrity Rules
- Monetary values are stored strictly as **integers in minor units** (e.g. `amount_cents` integer/bigint) alongside an ISO-4217 `currency` string (e.g., `'USD'`, `'EUR'`).
- Floating point data types are prohibited for money.

### Migration Management
- SQL migrations in `supabase/migrations` use sequential timestamp versioning (`00001_initial_schema.sql`, etc.).
- Migrations define enums, tables, foreign keys, triggers for `updated_at`, and RLS policies.

---

## 4. Auth & Core Authorization Model

### Authentication
- Built on Supabase Auth (JWT tokens containing user ID `sub` and user metadata).
- NestJS `AuthGuard` validates JWTs against Supabase JWT secret / public keys.

### Fine-Grained RBAC & Permissions
- Permissions follow domain format: `domain:action` (e.g., `organizations:read`, `quotes:create`, `quotes:approve`, `orders:manage`, `payments:process`).
- Roles are assigned per organization membership (e.g., `ORG_OWNER`, `ORG_ADMIN`, `FACTORY_MANAGER`, `CUSTOMER_BUYER`, `INSPECTOR`, `PLATFORM_ADMIN`).
- Backend routes use `@RequirePermissions(Permission.QUOTES_APPROVE)` combined with `PermissionsGuard` and tenant context checks.
- Authorization decisions are **never** rendered solely from frontend metadata or flags; every API route enforces authorization at the NestJS guard and database RLS layer.

---

## 5. Domain Boundaries

The NestJS API (`apps/api`) and shared contracts structure clean boundaries for all 17 domains:
1. `auth`
2. `organizations`
3. `catalog`
4. `rfq`
5. `quotes`
6. `orders`
7. `payments`
8. `invoicing`
9. `inventory`
10. `production`
11. `quality`
12. `shipping`
13. `documents`
14. `messaging`
15. `notifications`
16. `ai`
17. `audit`

---

## 6. Audit & Outbox Event Framework

- To ensure reliable events without losing audit trails during database transactions, business mutations insert an event record into `outbox_events` in the same DB transaction.
- The `apps/worker` polls or consumes `outbox_events` to dispatch notifications, record historical audit logs, or notify external integrations asynchronously.
- Direct synchronous audit records are also inserted into `audit_logs` with actor ID, organization ID, action, resource type/ID, and before/after state snapshots.

---

## 7. API Response & Error Handling Conventions

All API responses follow a uniform JSON structure:

```typescript
// Success Response
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "requestId": "req_12345"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User lacks required permission 'quotes:approve'",
    "details": [...]
  },
  "meta": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "requestId": "req_12345"
  }
}
```

Standardized HTTP Exception Filters catch domain exceptions and map them to standard codes (e.g., `UNAUTHORIZED`, `PERMISSION_DENIED`, `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `INVALID_STATE_TRANSITION`, `INTERNAL_ERROR`).

---

## 8. Verification & CI Strategy

- **Typecheck**: `pnpm run typecheck` across all workspace apps and packages.
- **Linting**: `pnpm run lint` using ESLint.
- **Testing**: Automated tests covering Auth/RBAC authorization matrix, multi-tenant checks, money calculation helpers, Zod validations, and state machine transitions.
- **Migration Verification**: Automated verification script to test SQL syntax and execution against PostgreSQL.
- **Production Build**: `pnpm run build` producing clean artifacts for web, api, worker, and packages.
