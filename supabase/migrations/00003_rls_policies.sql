-- 00003_rls_policies.sql
-- Enable Row Level Security (RLS) and define explicit policies for all 38 tables

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

-- Helper function to resolve current user ID safely from transaction claims or Supabase auth context
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check org membership safely against current session user
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = target_org_id
      AND user_id = public.current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles (1)
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (id = public.current_user_id()) WITH CHECK (id = public.current_user_id());

-- 2. Organizations & Members (2, 3)
CREATE POLICY "Organizations select" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Organizations insert" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizations update" ON public.organizations FOR UPDATE USING (public.is_org_member(id)) WITH CHECK (public.is_org_member(id));

CREATE POLICY "Org members select" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members insert" ON public.organization_members FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members update" ON public.organization_members FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members delete" ON public.organization_members FOR DELETE USING (public.is_org_member(organization_id));

-- 3. Projects & Site Parcels (4, 5)
CREATE POLICY "Projects select" ON public.projects FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Projects insert" ON public.projects FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Projects update" ON public.projects FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Projects delete" ON public.projects FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Site parcels select" ON public.site_parcels FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(p.organization_id)));
CREATE POLICY "Site parcels insert" ON public.site_parcels FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(p.organization_id)));
CREATE POLICY "Site parcels update" ON public.site_parcels FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(p.organization_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(p.organization_id)));

-- 4. Merchant Profiles & Capacities (6, 7)
CREATE POLICY "Merchant profiles select" ON public.merchant_profiles FOR SELECT USING (true);
CREATE POLICY "Merchant profiles update" ON public.merchant_profiles FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Factory capacities select" ON public.factory_capacities FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Factory capacities update" ON public.factory_capacities FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- 5. Catalog Products, Options, Configs, BOM (8, 9, 10, 11)
CREATE POLICY "Products select" ON public.products FOR SELECT USING (is_public = TRUE OR public.is_org_member(organization_id));
CREATE POLICY "Products insert" ON public.products FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Products update" ON public.products FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Products delete" ON public.products FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Product options select" ON public.product_options FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.is_public = TRUE OR public.is_org_member(p.organization_id))));
CREATE POLICY "Product options insert" ON public.product_options FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_org_member(p.organization_id)));
CREATE POLICY "Product options update" ON public.product_options FOR UPDATE USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_org_member(p.organization_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_org_member(p.organization_id)));

CREATE POLICY "Product configs select" ON public.product_configurations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Product configs insert" ON public.product_configurations FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "BOM select" ON public.bill_of_materials FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_org_member(p.organization_id)));
CREATE POLICY "BOM insert" ON public.bill_of_materials FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.is_org_member(p.organization_id)));

-- 6. RFQ, Quotes, Versions, Contracts (12, 13, 14, 15)
CREATE POLICY "RFQs select" ON public.rfqs FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "RFQs insert" ON public.rfqs FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "RFQs update" ON public.rfqs FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Quotes select" ON public.quotes FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Quotes insert" ON public.quotes FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Quotes update" ON public.quotes FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Quote versions select" ON public.quote_versions FOR SELECT USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND public.is_org_member(q.organization_id)));
CREATE POLICY "Quote versions insert" ON public.quote_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND public.is_org_member(q.organization_id)));

CREATE POLICY "Contracts select" ON public.contracts FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Contracts insert" ON public.contracts FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Contracts update" ON public.contracts FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- 7. Orders & Change Requests (16, 17)
CREATE POLICY "Orders select" ON public.orders FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Orders insert" ON public.orders FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Orders update" ON public.orders FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Change requests select" ON public.order_change_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Change requests insert" ON public.order_change_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id)));

-- 8. Invoices & Payments (18, 19)
CREATE POLICY "Invoices select" ON public.invoices FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Invoices insert" ON public.invoices FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Invoices update" ON public.invoices FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Payments select" ON public.payments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Payments insert" ON public.payments FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Payments update" ON public.payments FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- 9. Inventory, Movements, Reservations (20, 21, 22)
CREATE POLICY "Inventory select" ON public.inventory_items FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Inventory insert" ON public.inventory_items FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Inventory update" ON public.inventory_items FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Inventory movements select" ON public.inventory_movements FOR SELECT USING (EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND public.is_org_member(i.organization_id)));
CREATE POLICY "Inventory movements insert" ON public.inventory_movements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND public.is_org_member(i.organization_id)));

CREATE POLICY "Inventory reservations select" ON public.inventory_reservations FOR SELECT USING (EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND public.is_org_member(i.organization_id)));
CREATE POLICY "Inventory reservations insert" ON public.inventory_reservations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_items i WHERE i.id = inventory_item_id AND public.is_org_member(i.organization_id)));

-- 10. Production & QC (23, 24)
CREATE POLICY "Production orders select" ON public.production_orders FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Production orders insert" ON public.production_orders FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Production orders update" ON public.production_orders FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "QC inspections select" ON public.qc_inspections FOR SELECT USING (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_order_id AND public.is_org_member(po.organization_id)));
CREATE POLICY "QC inspections insert" ON public.qc_inspections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.production_orders po WHERE po.id = production_order_id AND public.is_org_member(po.organization_id)));

-- 11. Logistics: Shipments, Containers, Packages, Events (25, 26, 27, 28)
CREATE POLICY "Shipments select" ON public.shipments FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Shipments insert" ON public.shipments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Shipments update" ON public.shipments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_org_member(o.organization_id)));

CREATE POLICY "Containers select" ON public.shipment_containers FOR SELECT USING (EXISTS (SELECT 1 FROM public.shipments s JOIN public.orders o ON o.id = s.order_id WHERE s.id = shipment_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Containers insert" ON public.shipment_containers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s JOIN public.orders o ON o.id = s.order_id WHERE s.id = shipment_id AND public.is_org_member(o.organization_id)));

CREATE POLICY "Packages select" ON public.shipment_packages FOR SELECT USING (EXISTS (SELECT 1 FROM public.shipment_containers c JOIN public.shipments s ON s.id = c.shipment_id JOIN public.orders o ON o.id = s.order_id WHERE c.id = container_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Packages insert" ON public.shipment_packages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shipment_containers c JOIN public.shipments s ON s.id = c.shipment_id JOIN public.orders o ON o.id = s.order_id WHERE c.id = container_id AND public.is_org_member(o.organization_id)));

CREATE POLICY "Tracking events select" ON public.shipment_tracking_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.shipments s JOIN public.orders o ON o.id = s.order_id WHERE s.id = shipment_id AND public.is_org_member(o.organization_id)));
CREATE POLICY "Tracking events insert" ON public.shipment_tracking_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s JOIN public.orders o ON o.id = s.order_id WHERE s.id = shipment_id AND public.is_org_member(o.organization_id)));

-- 12. Documents & Versions (29, 30)
CREATE POLICY "Documents select" ON public.documents FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Documents insert" ON public.documents FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Documents update" ON public.documents FOR UPDATE USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Document versions select" ON public.document_versions FOR SELECT USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_org_member(d.organization_id)));
CREATE POLICY "Document versions insert" ON public.document_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_org_member(d.organization_id)));

-- 13. Conversations, Participants, Messages (31, 32, 33)
CREATE POLICY "Conversations select" ON public.conversations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Conversations insert" ON public.conversations FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Participants select" ON public.conversation_participants FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_org_member(c.organization_id)));
CREATE POLICY "Participants insert" ON public.conversation_participants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_org_member(c.organization_id)));

CREATE POLICY "Messages select" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_org_member(c.organization_id)));
CREATE POLICY "Messages insert" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND public.is_org_member(c.organization_id)));

-- 14. Support & Warranty Claims (34, 35)
CREATE POLICY "Support cases select" ON public.support_cases FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Support cases insert" ON public.support_cases FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Warranty claims select" ON public.warranty_claims FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Warranty claims insert" ON public.warranty_claims FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- 15. Notifications, Outbox, Audit (36, 37, 38)
CREATE POLICY "Notifications select" ON public.notifications FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "Notifications update" ON public.notifications FOR UPDATE USING (user_id = public.current_user_id()) WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "Outbox events select" ON public.outbox_events FOR SELECT USING (actor_id = public.current_user_id());
CREATE POLICY "Outbox events insert" ON public.outbox_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Audit logs select" ON public.audit_logs FOR SELECT USING (organization_id IS NULL OR public.is_org_member(organization_id));
CREATE POLICY "Audit logs insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
