-- 00010_contract_order_handoff.sql
-- Close the commercial handoff: a fully executed contract opens one order
-- and one deposit invoice from the frozen quote version.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS deposit_bps INT;

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_deposit_bps_range;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_deposit_bps_range
  CHECK (deposit_bps IS NULL OR (deposit_bps >= 1 AND deposit_bps <= 10000));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS quote_version INT,
  ADD COLUMN IF NOT EXISTS subtotal_cents BIGINT,
  ADD COLUMN IF NOT EXISTS tax_cents BIGINT,
  ADD COLUMN IF NOT EXISTS shipping_cents BIGINT,
  ADD COLUMN IF NOT EXISTS deposit_cents BIGINT;

UPDATE public.orders
SET
  order_number = COALESCE(
    order_number,
    'ORD-' || TO_CHAR(created_at, 'YYYY') || '-' || UPPER(SUBSTRING(id::text, 1, 8))
  ),
  subtotal_cents = COALESCE(subtotal_cents, total_amount_cents),
  tax_cents = COALESCE(tax_cents, 0),
  shipping_cents = COALESCE(shipping_cents, 0),
  deposit_cents = COALESCE(deposit_cents, total_amount_cents)
WHERE order_number IS NULL
   OR subtotal_cents IS NULL
   OR tax_cents IS NULL
   OR shipping_cents IS NULL
   OR deposit_cents IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET NOT NULL,
  ALTER COLUMN subtotal_cents SET NOT NULL,
  ALTER COLUMN tax_cents SET NOT NULL,
  ALTER COLUMN shipping_cents SET NOT NULL,
  ALTER COLUMN deposit_cents SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_order_number ON public.orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_contract_id
  ON public.orders(contract_id)
  WHERE contract_id IS NOT NULL;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS seller_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS milestone VARCHAR(50);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100);

-- Assigned factories may mark an RFQ quoted without rewriting the customer's brief.
CREATE OR REPLACE FUNCTION public.mark_rfq_quoted(target_rfq_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.rfqs r
    WHERE r.id = target_rfq_id
      AND (
        public.is_platform_admin()
        OR EXISTS (
          SELECT 1
          FROM public.rfq_supplier_assignments rsa
          WHERE rsa.rfq_id = r.id
            AND rsa.status = 'ACTIVE'
            AND public.is_org_member(rsa.supplier_organization_id)
        )
      )
  ) INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'RFQ status update is not permitted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.rfqs
  SET status = 'QUOTED', updated_at = NOW()
  WHERE id = target_rfq_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_rfq_quoted(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_rfq_quoted(UUID) TO authenticated;

-- A factory writing an audit row for a customer it is commercially engaged with.
CREATE OR REPLACE FUNCTION public.can_record_audit(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target_org_id IS NULL
    OR public.is_org_member(target_org_id)
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.organization_id = target_org_id
        AND q.seller_organization_id IS NOT NULL
        AND public.is_org_member(q.seller_organization_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.organization_id = target_org_id
        AND c.seller_organization_id IS NOT NULL
        AND public.is_org_member(c.seller_organization_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_supplier_assignments rsa
      WHERE rsa.customer_organization_id = target_org_id
        AND rsa.status = 'ACTIVE'
        AND public.is_org_member(rsa.supplier_organization_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.organization_id = target_org_id
        AND o.seller_organization_id IS NOT NULL
        AND public.is_org_member(o.seller_organization_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_record_audit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_record_audit(UUID) TO authenticated;

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    actor_id = public.current_actor_id()
    AND public.can_record_audit(organization_id)
  );

DROP POLICY IF EXISTS "quote_versions_all" ON public.quote_versions;
CREATE POLICY "quote_versions_all" ON public.quote_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_versions.quote_id
        AND (
          public.is_org_member(q.organization_id)
          OR (
            q.seller_organization_id IS NOT NULL
            AND public.is_org_member(q.seller_organization_id)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_versions.quote_id
        AND (
          public.is_org_member(q.organization_id)
          OR (
            q.seller_organization_id IS NOT NULL
            AND public.is_org_member(q.seller_organization_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "orders_all" ON public.orders;
CREATE POLICY "orders_all" ON public.orders
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

DROP POLICY IF EXISTS "invoices_all" ON public.invoices;
CREATE POLICY "invoices_all" ON public.invoices
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
