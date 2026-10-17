-- 00007_supplier_quote_boundaries.sql

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS rfq_number VARCHAR(100);

UPDATE public.rfqs
SET rfq_number = 'RFQ-' || TO_CHAR(created_at, 'YYYY') || '-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE rfq_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rfqs_rfq_number ON public.rfqs(rfq_number);
ALTER TABLE public.rfqs ALTER COLUMN rfq_number SET NOT NULL;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS seller_organization_id UUID REFERENCES public.organizations(id);

UPDATE public.quotes
SET quote_number = 'QTE-' || TO_CHAR(created_at, 'YYYY') || '-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE quote_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quotes_quote_number ON public.quotes(quote_number);
ALTER TABLE public.quotes ALTER COLUMN quote_number SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.rfq_supplier_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  customer_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rfq_id, supplier_organization_id),
  CHECK (status IN ('INVITED', 'ACTIVE', 'DECLINED', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS idx_rfq_supplier_assignments_supplier
  ON public.rfq_supplier_assignments(supplier_organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_quotes_rfq_seller
  ON public.quotes(rfq_id, seller_organization_id)
  WHERE seller_organization_id IS NOT NULL;

ALTER TABLE public.rfq_supplier_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfqs_all" ON public.rfqs;
CREATE POLICY "rfqs_all" ON public.rfqs
  FOR ALL
  USING (
    public.is_org_member(organization_id)
    OR EXISTS (
      SELECT 1
      FROM public.rfq_supplier_assignments rsa
      WHERE rsa.rfq_id = rfqs.id
        AND public.is_org_member(rsa.supplier_organization_id)
        AND rsa.status = 'ACTIVE'
    )
  )
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "rfq_items_select" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_insert" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_update" ON public.rfq_items;
DROP POLICY IF EXISTS "rfq_items_delete" ON public.rfq_items;

CREATE POLICY "rfq_items_all" ON public.rfq_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND (
          public.is_org_member(r.organization_id)
          OR EXISTS (
            SELECT 1
            FROM public.rfq_supplier_assignments rsa
            WHERE rsa.rfq_id = r.id
              AND public.is_org_member(rsa.supplier_organization_id)
              AND rsa.status = 'ACTIVE'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_items.rfq_id
        AND public.is_org_member(r.organization_id)
    )
  );

DROP POLICY IF EXISTS "quotes_all" ON public.quotes;
CREATE POLICY "quotes_all" ON public.quotes
  FOR ALL
  USING (
    public.is_org_member(organization_id)
    OR (
      seller_organization_id IS NOT NULL
      AND public.is_org_member(seller_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    OR (
      seller_organization_id IS NOT NULL
      AND public.is_org_member(seller_organization_id)
    )
  );

CREATE POLICY "rfq_supplier_assignments_select"
  ON public.rfq_supplier_assignments FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_org_member(customer_organization_id)
    OR public.is_org_member(supplier_organization_id)
  );

CREATE POLICY "rfq_supplier_assignments_insert"
  ON public.rfq_supplier_assignments FOR INSERT
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "rfq_supplier_assignments_update"
  ON public.rfq_supplier_assignments FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "rfq_supplier_assignments_delete"
  ON public.rfq_supplier_assignments FOR DELETE
  USING (public.is_platform_admin());
