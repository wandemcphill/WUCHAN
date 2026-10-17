-- Customer prefab builds.
-- A factory publishes option groups. A customer freezes a configuration.
-- Standard builds are received at the catalog price. Special builds wait for a factory quote.

ALTER TABLE public.product_options
  ADD COLUMN IF NOT EXISTS lead_time_delta_days INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_quote BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS swatch_hex CHAR(7);

ALTER TABLE public.product_options
  DROP CONSTRAINT IF EXISTS product_options_swatch_hex_format;

ALTER TABLE public.product_options
  ADD CONSTRAINT product_options_swatch_hex_format
  CHECK (swatch_hex IS NULL OR swatch_hex ~ '^#[0-9A-Fa-f]{6}$');

CREATE TABLE IF NOT EXISTS public.build_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  build_number VARCHAR(40) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  customer_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  seller_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  selected_options JSONB NOT NULL,
  custom_note TEXT,
  is_special BOOLEAN NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('RECEIVED', 'QUOTE_NEEDED', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  currency currency_code NOT NULL,
  catalog_price_cents BIGINT NOT NULL CHECK (catalog_price_cents >= 0),
  lead_time_days INT NOT NULL CHECK (lead_time_days >= 1),
  quoted_price_cents BIGINT CHECK (quoted_price_cents IS NULL OR quoted_price_cents >= 0),
  quoted_lead_time_days INT CHECK (quoted_lead_time_days IS NULL OR quoted_lead_time_days >= 1),
  quote_note TEXT,
  quote_valid_until TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_orders_customer ON public.build_orders (customer_organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_build_orders_seller ON public.build_orders (seller_organization_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.freeze_build_order_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.customer_organization_id IS DISTINCT FROM OLD.customer_organization_id
     OR NEW.seller_organization_id IS DISTINCT FROM OLD.seller_organization_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.selected_options IS DISTINCT FROM OLD.selected_options
     OR NEW.custom_note IS DISTINCT FROM OLD.custom_note
     OR NEW.is_special IS DISTINCT FROM OLD.is_special
     OR NEW.catalog_price_cents IS DISTINCT FROM OLD.catalog_price_cents
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.lead_time_days IS DISTINCT FROM OLD.lead_time_days
     OR NEW.build_number IS DISTINCT FROM OLD.build_number
  THEN
    RAISE EXCEPTION 'build order snapshot is immutable';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_build_order_snapshot ON public.build_orders;
CREATE TRIGGER trg_freeze_build_order_snapshot
  BEFORE UPDATE ON public.build_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.freeze_build_order_snapshot();

ALTER TABLE public.build_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "build_orders_select" ON public.build_orders;
CREATE POLICY "build_orders_select" ON public.build_orders
  FOR SELECT USING (
    public.is_org_member(customer_organization_id)
    OR public.is_org_member(seller_organization_id)
  );

DROP POLICY IF EXISTS "build_orders_insert" ON public.build_orders;
CREATE POLICY "build_orders_insert" ON public.build_orders
  FOR INSERT WITH CHECK (public.is_org_member(customer_organization_id));

DROP POLICY IF EXISTS "build_orders_update" ON public.build_orders;
CREATE POLICY "build_orders_update" ON public.build_orders
  FOR UPDATE USING (
    public.is_org_member(customer_organization_id)
    OR public.is_org_member(seller_organization_id)
  )
  WITH CHECK (
    public.is_org_member(customer_organization_id)
    OR public.is_org_member(seller_organization_id)
  );

