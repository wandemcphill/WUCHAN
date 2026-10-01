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
