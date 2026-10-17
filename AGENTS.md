# WUCHAN Engineering Constitution

WUCHAN is an international B2B prefab/modular-building commerce and factory-operations platform.

## Non-negotiable principles

- Build real end-to-end workflows, not decorative screens.
- Preserve working behavior. Never rewrite working systems without evidence and a migration plan.
- Business rules belong on the server/domain layer, not only in the browser.
- Money must use exact arithmetic and immutable transaction snapshots.
- Multi-tenant authorization must be enforced server-side and at the database boundary where applicable.
- Never weaken authentication, authorization, RLS, validation, or secrets handling to make a feature work.
- Never fabricate payment, inventory, production, shipment, QC, or document states.
- Quotes, invoices, payments, contracts, order changes, and audit records require historical integrity.
- AI may assist and propose. It must not silently execute sensitive commercial or financial actions.
- Every major feature must include loading, empty, error, permission, and mobile states.
- Every major workflow must have automated tests.
- Async jobs must be retry-safe and idempotent.

## Parallel Jules sessions

Three sessions may work concurrently.

### Lane A: Platform / Data / Backend
Own:
- repository foundation
- database schema and migrations
- auth
- organizations and memberships
- roles/permissions
- backend module boundaries
- API contracts
- events/outbox
- audit
- notifications framework
- CI/test foundation

Do not build large customer/factory UI surfaces.

### Lane B: Customer Experience
Own:
- public catalogue UX
- product detail
- configurator UX
- customer onboarding
- customer dashboard
- projects
- RFQs
- quote viewing/comparison/acceptance
- customer document views
- customer messaging surfaces

Use shared typed contracts and fixtures/adapters where backend work is not yet merged.

### Lane C: Merchant / Factory Experience
Own:
- seller onboarding/profile
- seller dashboard
- product management UX
- inventory UX
- RFQ/quote management
- orders
- production board
- QC
- shipment operations
- factory documents
- seller messaging

Use shared typed contracts and fixtures/adapters where backend work is not yet merged.

## File ownership

Avoid simultaneous edits to root configuration and shared files.

Prefer domain-owned paths:
- apps/web/src/features/customer/*
- apps/web/src/features/merchant/*
- apps/api/src/modules/<domain>/*
- packages/contracts/*
- packages/ui/*

When shared files must change, keep the change minimal and call it out in the PR.

## Merge protocol

- Work on focused branches.
- Keep commits coherent.
- Rebase/update against main before final handoff.
- Open a PR rather than pushing directly to main after the initial bootstrap.
- Every PR must state: what changed, affected domains, schema/API changes, permissions, tests, and known limitations.
- Do not merge merely because the UI renders.

## Cursor Cloud specific instructions

- pnpm 10.18.3 is pinned by `packageManager`. `.cursor/install.sh` puts Node and pnpm on `/usr/local/bin`, runs `pnpm install --frozen-lockfile`, and builds `@wuchan/contracts` and `@wuchan/validation` (both packages export `dist/`).
- `.cursor/start.sh` starts local PostgreSQL at `postgresql://postgres:postgres@127.0.0.1:5432/wuchan`, creates the Supabase-compatible `auth.uid()` function and `authenticated` role, then applies `supabase/migrations` and `supabase/seed.sql`. Hosted Supabase credentials are not required for this.
- The Nest API listens on port 3001 with `NODE_ENV=development` and `ALLOW_DEV_AUTH=true`. The Next.js app listens on port 3000 and proxies to `WUCHAN_API_URL=http://127.0.0.1:3001`. Customer sign-in still needs real `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
- Checks used in CI: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run db:verify`, and `pnpm run build`.
- `main` does not contain the monorepo yet. Cloud environment builds of this setup must check out a revision that has `package.json` (currently `cursor/finish-commercial-spine-299c` and branches cut from it). Install skips the workspace step when `package.json` is absent.
