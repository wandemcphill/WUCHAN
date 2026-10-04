-- 00003_rls_policies.sql
-- Enable Row Level Security (RLS) on all user and tenant tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership safely against current session user
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = target_org_id
      AND user_id = COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID,
        auth.uid()
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles RLS
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated' OR current_setting('request.jwt.claim.sub', true) IS NOT NULL);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()))
  WITH CHECK (id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));

-- 2. Organizations RLS
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

-- 3. Products RLS (Public Catalog vs Tenant Catalog)
CREATE POLICY "Public items readable by everyone, tenant items by members"
  ON public.products FOR SELECT
  USING (is_public = TRUE OR public.is_org_member(organization_id));

CREATE POLICY "Org members can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update their products"
  ON public.products FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can delete their products"
  ON public.products FOR DELETE
  USING (public.is_org_member(organization_id));

-- 4. RFQ, Quotes, Orders Tenant Mutation Policies
CREATE POLICY "Org members can view RFQs"
  ON public.rfqs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert RFQs"
  ON public.rfqs FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update RFQs"
  ON public.rfqs FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view orders"
  ON public.orders FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- 5. Notifications RLS
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()))
  WITH CHECK (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));
