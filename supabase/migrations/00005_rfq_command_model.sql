-- 00005_rfq_command_model.sql
-- Persist the commercial scope of an RFQ separately from its narrative.

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS destination_port TEXT,
  ADD COLUMN IF NOT EXISTS incoterms_requested VARCHAR(10);

UPDATE public.rfqs
SET destination_port = COALESCE(destination_port, ''),
    incoterms_requested = COALESCE(incoterms_requested, 'DDP');

ALTER TABLE public.rfqs
  ALTER COLUMN destination_port SET DEFAULT '',
  ALTER COLUMN incoterms_requested SET DEFAULT 'DDP';

CREATE TABLE IF NOT EXISTS public.rfq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  target_unit_price_cents BIGINT CHECK (target_unit_price_cents >= 0),
  currency currency_code NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id
  ON public.rfq_items(rfq_id);

ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfq_items_select"
  ON public.rfq_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  );

CREATE POLICY "rfq_items_insert"
  ON public.rfq_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  );

CREATE POLICY "rfq_items_update"
  ON public.rfq_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  );

CREATE POLICY "rfq_items_delete"
  ON public.rfq_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  );
