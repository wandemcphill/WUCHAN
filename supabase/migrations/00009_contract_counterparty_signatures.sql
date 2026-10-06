-- 00009_contract_counterparty_signatures.sql

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS seller_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS customer_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_signed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS seller_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_signed_by UUID REFERENCES public.profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_quote_id ON public.contracts(quote_id);

DROP POLICY IF EXISTS "contracts_all" ON public.contracts;

CREATE POLICY "contracts_all" ON public.contracts
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
