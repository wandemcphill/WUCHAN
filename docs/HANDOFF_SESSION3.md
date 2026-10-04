# Session 3 Handoff — Merchant / Factory Experience Lane

## Summary of Completed Work
Session 3 built the complete operational workspace for sellers and factories manufacturing and selling prefab/modular structures on the WUCHAN platform.

### Key Capabilities Built:
1. **Domain Contracts & Adapter (`packages/contracts`)**:
   - `types.ts`: Domain models for Organization/Factory/Merchant Profiles, Leads/CRM, RFQs, Immutable Quote Versioning, Multi-level BOMs, 10 Inventory States (`available`, `reserved`, `allocated`, `in_production`, `qc_hold`, `damaged`, `quarantined`, `packed`, `dispatched`, `in_transit`), Visual Production Pipeline, Order Change Requests (CR), Logistics Hierarchy (`shipment` → `container` → `package/unit` → `tracking events`), Invoicing & Payments, Conversations, After-Sales/Warranty, and Analytics.
   - `fixtures.ts`: Mock operational data.
   - `adapter.ts`: Typed adapter (`MerchantAdapter`) supporting state transitions and queries.
   - `adapter.test.ts`: Unit tests verifying contract behavior (6/6 tests passing).

2. **Merchant Operational Workspace UI (`apps/web`)**:
   - `DashboardView`: Prioritized queue covering 10 operational action categories.
   - `ProfileView`: Legal organization, factory facility area/capacity/certifications, and merchant bank details.
   - `LeadsCustomersView`: Buyer lead qualification and customer lifetime value.
   - `RFQQuoteView`: RFQ management with append-only versioned commercial quotes.
   - `ProductBOMView`: Product specifications, configurable option price modifiers, and multi-level BOMs.
   - `InventoryView`: Granular 10-state stock distribution and stock reservation tracking across warehouses.
   - `ProductionQCView`: Visual 7-stage production pipeline (`order` → `engineering` → `material allocation` → `production` → `QC` → `packaging` → `dispatch`) with pass/fail inspection defect logs.
   - `OrdersFinancialsView`: Confirmed order workflow requiring Change Requests (CR) rather than destructive edits, plus milestone invoicing and payments.
   - `LogisticsDocumentsView`: Logistics hierarchy breakdown, export document checklist verification, and real-time tracking events.
   - `SupportWarrantyView`: B2B buyer conversation threads and after-sales warranty claims.
   - `AnalyticsView`: Operational KPIs and monthly revenue trends.

---

## Backend Contract & Integration Dependencies Waiting on Session 1 (Platform / Data / Backend)

When Session 1 merges database schemas, migrations, API endpoints, and authentication, the following contract and backend endpoints will need to be connected to replace the `MerchantAdapter` typed fixture:

1. **Organization & Factory Authentication / Membership**:
   - `GET /api/v1/organizations/me`
   - `PATCH /api/v1/organizations/:id`
   - `GET /api/v1/factories/:id`
   - `PATCH /api/v1/factories/:id`
   - *Dependency*: Real RLS enforcement ensuring factory operators can only view/manage their assigned tenant organization data.

2. **RFQ & Append-Only Quote Versioning Engine**:
   - `GET /api/v1/merchant/rfqs`
   - `POST /api/v1/merchant/rfqs/:id/quotes`
   - `POST /api/v1/merchant/quotes/:id/versions` (append new version snapshot)
   - *Dependency*: Database schema requiring a `quote_versions` table with unique constraint on `(quote_id, version_number)` to guarantee version immutability.

3. **10-State Inventory Ledger & Stock Reservations**:
   - `GET /api/v1/merchant/inventory`
   - `POST /api/v1/merchant/inventory/adjust`
   - `POST /api/v1/merchant/reservations`
   - *Dependency*: Database constraint enforcing non-negative stock counts and state transitions between `available`, `reserved`, `allocated`, `in_production`, `qc_hold`, `damaged`, `quarantined`, `packed`, `dispatched`, and `in_transit`.

4. **Production Orders & Stage QC Auditing**:
   - `GET /api/v1/merchant/production-orders`
   - `PATCH /api/v1/merchant/production-orders/:id/stage`
   - `POST /api/v1/merchant/production-orders/:id/qc-inspections`
   - *Dependency*: Production step state machine validation (`order` → `engineering` → `material_allocation` → `production` → `qc` → `packaging` → `dispatch`).

5. **Order Change Request (CR) State Machine**:
   - `POST /api/v1/merchant/orders/:id/change-requests`
   - `PATCH /api/v1/merchant/change-requests/:id/approve`
   - *Dependency*: Backend protocol preventing direct edits to confirmed orders, enforcing `order_change_requests` table records with commercial and schedule impact logging.

6. **Logistics Hierarchy & Export Document Verification**:
   - `GET /api/v1/merchant/shipments`
   - `POST /api/v1/merchant/shipments/:id/containers`
   - `POST /api/v1/merchant/documents/verify`
   - *Dependency*: Object storage (Supabase Storage) signed URLs for verified export certificates and commercial invoices.

7. **Real-time Notifications & Messaging Outbox**:
   - WebSocket/SSE feed or BullMQ outbox event subscriptions for `system_notifications` and `customer_conversations`.
