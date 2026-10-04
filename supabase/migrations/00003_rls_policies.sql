-- 00003_rls_policies.sql
-- Enable Row Level Security (RLS) on all user and tenant tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
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

-- 1. Profiles & Organizations
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid())) WITH CHECK (id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));

CREATE POLICY "Organizations select" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Organizations insert" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizations update" ON public.organizations FOR UPDATE USING (public.is_org_member(id)) WITH CHECK (public.is_org_member(id));

CREATE POLICY "Org members select" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members insert" ON public.organization_members FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members update" ON public.organization_members FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- 2. Projects & Merchant Profiles
CREATE POLICY "Projects select" ON public.projects FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Projects insert" ON public.projects FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Projects update" ON public.projects FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Merchant profiles select" ON public.merchant_profiles FOR SELECT USING (true);
CREATE POLICY "Merchant profiles update" ON public.merchant_profiles FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- 3. Catalog & Products
CREATE POLICY "Products select" ON public.products FOR SELECT USING (is_public = TRUE OR public.is_org_member(organization_id));
CREATE POLICY "Products insert" ON public.products FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Products update" ON public.products FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Products delete" ON public.products FOR DELETE USING (public.is_org_member(organization_id));

-- 4. Commercial (RFQs, Quotes, Contracts, Orders)
CREATE POLICY "RFQs select" ON public.rfqs FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "RFQs insert" ON public.rfqs FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "RFQs update" ON public.rfqs FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Quotes select" ON public.quotes FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Quotes insert" ON public.quotes FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Quotes update" ON public.quotes FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Orders select" ON public.orders FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Orders insert" ON public.orders FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Orders update" ON public.orders FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Invoices select" ON public.invoices FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Invoices insert" ON public.invoices FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Payments select" ON public.payments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Payments insert" ON public.payments FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- 5. Inventory & Operations
CREATE POLICY "Inventory select" ON public.inventory_items FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Inventory insert" ON public.inventory_items FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Inventory update" ON public.inventory_items FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Production orders select" ON public.production_orders FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Production orders insert" ON public.production_orders FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- 6. Documents & Messaging
CREATE POLICY "Documents select" ON public.documents FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Documents insert" ON public.documents FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Conversations select" ON public.conversations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Conversations insert" ON public.conversations FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- 7. Notifications & Audit
CREATE POLICY "Notifications select" ON public.notifications FOR SELECT USING (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));
CREATE POLICY "Notifications update" ON public.notifications FOR UPDATE USING (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid())) WITH CHECK (user_id = COALESCE(NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID, auth.uid()));

CREATE POLICY "Audit logs select" ON public.audit_logs FOR SELECT USING (organization_id IS NULL OR public.is_org_member(organization_id));
