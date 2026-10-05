# WUCHAN Customer Experience Mock Data Adapters & Integration Points

This document provides a complete inventory of mock data adapters and typed interfaces used in the customer-facing experience (`apps/web`). When the platform lane backend endpoints become available, these adapters can be swapped cleanly for live REST/GraphQL or Supabase API calls.

---

## 1. Adapter Architecture Overview

All customer domain data flows through `apps/web/src/lib/adapters/mockData.ts` and standard contract definitions from `@wuchan/contracts` (`packages/contracts/src/index.ts`).

- **Shared Domain Contracts:** `@wuchan/contracts`
- **Adapter Location:** `apps/web/src/lib/adapters/mockData.ts`
- **Hook Layer:** UI components consume async helpers (e.g. `getMockProductById`, `getMockQuotesForRFQ`, `getMockOrders`) designed to mirror standard API response structures.

---

## 2. Integration Mapping Table

| Domain / Entity | Mock Adapter Function / Object | Target Backend API / Supabase Table | Integration Notes & Payload Requirements |
| :--- | :--- | :--- | :--- |
| **Products & Catalog** | `MOCK_PRODUCTS`<br>`getMockProductById(id)` | `GET /api/v1/products`<br>`GET /api/v1/products/:id` | Connect to live catalog DB. Payload includes physical dimensions, thermal ratings (R-value), structural loads, BOM items, and container packing limits. |
| **Option Configurator** | `MOCK_PRODUCTS.options` | `POST /api/v1/products/:id/configure` | Calculates spec delta (price minor units, lead time delta, shipping volume CBM delta) dynamically. |
| **Projects & Sites** | `MOCK_PROJECTS`<br>`getMockProjectById(id)` | `GET /api/v1/projects`<br>`POST /api/v1/projects` | Parcel site register including soil bearing capacity (kPa), seismic zones, local building codes, and linked RFQs/Orders. |
| **RFQ Engine** | `MOCK_RFQS`<br>`getMockRFQById(id)` | `POST /api/v1/rfqs`<br>`GET /api/v1/rfqs/:id` | B2B quote request containing parcel ID, desired Incoterms (DDP/CIF/FOB), requested options, and attached civil site plans. |
| **Quotes & Versions** | `MOCK_QUOTES`<br>`getMockQuoteById(id)` | `GET /api/v1/quotes/:id`<br>`GET /api/v1/quotes/:id/versions` | Multi-version quote matrix (e.g. `v1` vs `v2`) with commercial line items, structural engineering fees, ocean freight estimates, and deposit terms. |
| **Quote Approval** | `approveQuote(id)` | `POST /api/v1/quotes/:id/approve` | Formal B2B commercial agreement signature workflow triggering order creation and deposit invoice generation. |
| **Order Lifecycle** | `MOCK_ORDERS`<br>`getMockOrderById(id)` | `GET /api/v1/orders/:id` | Tracks order state across the 16-stage B2B procurement state machine (`DRAFT` → `DELIVERED_AND_ACCEPTED`). Identifies specific responsible party (e.g., *WUCHAN Logistics*, *Factory Structural QA*, *Customer Civil Engineer*). |
| **Payments & Invoices** | `MOCK_PAYMENT_SCHEDULES`<br>`getMockPaymentSchedule(orderId)` | `GET /api/v1/orders/:id/payments`<br>`POST /api/v1/orders/:id/payments/receipt` | Payment milestone breakdown (e.g. 30% Deposit, 40% Frame Completion, 20% Shipping, 10% Delivery), international bank wire instructions (SWIFT/IBAN), and wire transfer proof upload. |
| **Shipments & Logistics** | `MOCK_SHIPMENTS`<br>`getMockShipmentByOrderId(id)` | `GET /api/v1/orders/:id/shipment` | Vessel IMO, ocean bill of lading, container seal numbers, packing manifest breakdown, and real-time transit event tracking. |
| **Document Vault** | `MOCK_DOCUMENTS`<br>`getMockDocumentsByOrderId(id)` | `GET /api/v1/documents?orderId=:id` | Structural calculations, stamped PE drawings, bill of lading, commercial invoices, and site installation manuals. |
| **Messaging** | `MOCK_CONVERSATIONS`<br>`getMockConversation(orderId)` | `GET /api/v1/messages?orderId=:id`<br>`POST /api/v1/messages` | Threaded communication channel between buyer procurement team, WUCHAN project manager, and engineering leads. |

---

## 3. Key Non-Mocked / Production Protections

- **Zero Fake Success States:** Payment submission, wire transfer receipt uploads, and quote approvals explicitly set statuses to `PENDING_VERIFICATION` or `UNDER_REVIEW` without claiming funds have been transferred or orders placed without real backend verification.
- **Strict Currency Unit Minor Types:** All monetary amounts are formatted using integer minor units (e.g., `$48,500` stored as `4850000` USD cents) to prevent floating-point discrepancy during backend migration.
