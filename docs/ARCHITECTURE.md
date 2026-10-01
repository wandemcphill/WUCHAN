# WUCHAN Master Architecture

## Product

WUCHAN is a cross-border prefab/modular-building commerce and operations platform for:
- prefab cabins
- modular houses
- prefab offices
- prefab restaurants/cafes
- warehouses
- steel-frame buildings
- glamping pods
- container homes
- luxury dome structures

The system serves two primary experiences on one platform:

1. Customer procurement workspace
2. Factory/merchant operating workspace

## Domain backbone

Identity & Organizations
→ Catalogue & Configuration
→ RFQ
→ Quote Versioning
→ Contract
→ Order
→ Payment / Invoicing
→ Engineering
→ Inventory / BOM
→ Production
→ QC
→ Packaging
→ Shipment / Containers / Packages
→ International Tracking
→ Delivery
→ Installation
→ Warranty / After-sales

Cross-cutting:
- messaging
- documents
- translation
- notifications
- search
- audit
- AI
- analytics

## Core domain entities

Organizations, organization_members, roles, permissions, customers, factories, warehouses, product_families, products, product_variants, product_options, product_configurations, BOMs, inventory_items, inventory_movements, inventory_reservations, projects, RFQs, quotes, quote_versions, contracts, orders, order_changes, invoices, invoice_items, payments, payment_allocations, refunds, production_orders, production_steps, QC inspections/findings, shipments, containers, packages, tracking_events, documents/document_versions, conversations, participants, messages, support_cases, warranty_claims, notifications, audit_logs, business_events.

This is a domain map, not permission to create every table immediately. Prefer the minimum coherent schema for the current vertical slice.

## Product model

A product is not merely name + price + image.

Product family
→ product model
→ configurable options
→ configuration snapshot
→ BOM/components
→ physical/logistics profile
→ price
→ technical/commercial documents
→ media

Configurable selections may alter:
- price
- weight
- dimensions
- CBM
- components
- lead time
- packaging
- shipping profile

## RFQ and quote

RFQs are first-class records tied to a customer project.

Quotes are versioned. Never overwrite a previously accepted or issued commercial version.

A quote version snapshots:
- line items
- configuration
- quantities
- currency
- discounts
- shipping
- payment terms
- delivery terms
- validity
- notes

## Order state

Use an explicit server-controlled state machine. Initial target:

DRAFT
→ QUOTED
→ ACCEPTED
→ CONTRACT_PENDING
→ DEPOSIT_PENDING
→ CONFIRMED
→ ENGINEERING
→ PRODUCTION
→ QC
→ READY_TO_SHIP
→ SHIPPED
→ IN_TRANSIT
→ ARRIVED
→ DELIVERED
→ INSTALLATION
→ COMPLETED

Exceptions:
ON_HOLD, CANCELLED, DISPUTED

Do not create conflicting parallel status systems.

## Inventory

Distinguish:
- raw materials
- components
- semi-finished
- finished goods
- serialized units
- reserved
- allocated
- QC hold
- damaged
- quarantined
- dispatched
- in transit

Available stock is not automatically sellable stock.

## International logistics

Model:
Order
→ Shipment
→ Container
→ Package/Unit

One order can have multiple shipments. One shipment can contain multiple containers. Containers can contain multiple packages/units.

Tracking is event-based and stores timestamp, location, source, notes and evidence where available.

## Financial integrity

Support payment schedules and milestone payments.

Financial states must be server-controlled and idempotent.

Never recalculate historical invoices/quotes using current catalogue prices.

Never expose privileged payment credentials to the browser.

## Change orders

Confirmed orders are not silently edited.

Use:
Order
→ Change Request
→ Commercial Impact
→ Production Impact
→ Customer Approval
→ Financial Adjustment
→ Approved Change

## AI boundary

AI can search, summarize, explain, compare, translate and draft.

AI must not independently:
- change prices
- approve discounts
- issue refunds
- mark payment received
- change bank details
- change destination
- cancel orders
- release shipments
- sign contracts

Sensitive actions require explicit authorized user confirmation.

## Technical direction

Preferred initial architecture:
- Next.js
- NestJS
- PostgreSQL/Supabase
- Supabase Auth
- Supabase Storage
- Redis/BullMQ for async jobs
- Render
- GitHub CI

Start as a modular monolith plus worker, not unnecessary microservices.

Suggested layout:

apps/web
apps/api
apps/worker

packages/ui
packages/contracts
packages/validation
packages/config

supabase/migrations

docs/

## Definition of done

A feature is complete only when UI, API, business logic, persistence, permissions, state transitions, error handling and tests agree.

No fake backends.
No placeholder success states.
No silent data loss.
No authorization shortcuts.
