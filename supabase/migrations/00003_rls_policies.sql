-- 00003_rls_policies.sql
-- WUCHAN tenant security policies. Policies are intentionally explicit by
-- relationship so child rows inherit the parent organization's boundary.

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

CREATE OR REPLACE FUNCTION public.current_actor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID,
    auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = public.current_actor_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = public.current_actor_id()
      AND om.role IN ('PLATFORM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = public.current_actor_id()
      AND om.role = 'PLATFORM_ADMIN'
  );
$$;

-- Profiles
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    id = public.current_actor_id()
    OR EXISTS (
      SELECT 1
      FROM public.organization_members mine
      JOIN public.organization_members theirs
        ON theirs.organization_id = mine.organization_id
      WHERE mine.user_id = public.current_actor_id()
        AND theirs.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (id = public.current_actor_id())
  WITH CHECK (id = public.current_actor_id());

-- Organizations / memberships
CREATE POLICY "organizations_select"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id) OR public.is_platform_admin());

CREATE POLICY "organizations_insert"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "organizations_update"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id) OR public.is_platform_admin())
  WITH CHECK (public.is_org_admin(id) OR public.is_platform_admin());

CREATE POLICY "organization_members_select"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id) OR public.is_platform_admin());

CREATE POLICY "organization_members_insert"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.is_org_admin(organization_id)
    OR public.is_platform_admin()
    OR (
      user_id = public.current_actor_id()
      AND NOT EXISTS (
        SELECT 1
        FROM public.organization_members existing
        WHERE existing.organization_id = organization_members.organization_id
      )
      AND role = 'ORG_OWNER'
    )
  );

CREATE POLICY "organization_members_update"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin(organization_id) OR public.is_platform_admin())
  WITH CHECK (public.is_org_admin(organization_id) OR public.is_platform_admin());

CREATE POLICY "organization_members_delete"
  ON public.organization_members FOR DELETE
  USING (public.is_org_admin(organization_id) OR public.is_platform_admin());

-- Direct organization-owned tables
CREATE POLICY "projects_all" ON public.projects
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "merchant_profiles_select" ON public.merchant_profiles
  FOR SELECT USING (true);

CREATE POLICY "merchant_profiles_write" ON public.merchant_profiles
  FOR ALL USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "factory_capacities_all" ON public.factory_capacities
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "products_all" ON public.products
  FOR ALL
  USING (is_public = TRUE OR public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "product_configurations_all" ON public.product_configurations
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "rfqs_all" ON public.rfqs
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "quotes_all" ON public.quotes
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "contracts_all" ON public.contracts
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "orders_all" ON public.orders
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "invoices_all" ON public.invoices
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "payments_all" ON public.payments
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "inventory_items_all" ON public.inventory_items
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "production_orders_all" ON public.production_orders
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "documents_all" ON public.documents
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "conversations_all" ON public.conversations
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "support_cases_all" ON public.support_cases
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "warranty_claims_all" ON public.warranty_claims
  FOR ALL USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- Child rows inheriting an organization boundary
CREATE POLICY "site_parcels_all" ON public.site_parcels
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = site_parcels.project_id
      AND public.is_org_member(p.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = site_parcels.project_id
      AND public.is_org_member(p.organization_id)
  ));

CREATE POLICY "product_options_all" ON public.product_options
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_options.product_id
      AND public.is_org_member(p.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_options.product_id
      AND public.is_org_member(p.organization_id)
  ));

CREATE POLICY "bill_of_materials_all" ON public.bill_of_materials
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = bill_of_materials.product_id
      AND public.is_org_member(p.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = bill_of_materials.product_id
      AND public.is_org_member(p.organization_id)
  ));

CREATE POLICY "quote_versions_all" ON public.quote_versions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_versions.quote_id
      AND public.is_org_member(q.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_versions.quote_id
      AND public.is_org_member(q.organization_id)
  ));

CREATE POLICY "order_change_requests_all" ON public.order_change_requests
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_change_requests.order_id
      AND public.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_change_requests.order_id
      AND public.is_org_member(o.organization_id)
  ));

CREATE POLICY "inventory_movements_all" ON public.inventory_movements
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = inventory_movements.inventory_item_id
      AND public.is_org_member(i.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = inventory_movements.inventory_item_id
      AND public.is_org_member(i.organization_id)
  ));

CREATE POLICY "inventory_reservations_all" ON public.inventory_reservations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = inventory_reservations.inventory_item_id
      AND public.is_org_member(i.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = inventory_reservations.inventory_item_id
      AND public.is_org_member(i.organization_id)
  ));

CREATE POLICY "qc_inspections_all" ON public.qc_inspections
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.production_orders po
    WHERE po.id = qc_inspections.production_order_id
      AND public.is_org_member(po.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.production_orders po
    WHERE po.id = qc_inspections.production_order_id
      AND public.is_org_member(po.organization_id)
  ));

CREATE POLICY "shipments_all" ON public.shipments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id
      AND public.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id
      AND public.is_org_member(o.organization_id)
  ));

CREATE POLICY "shipment_containers_all" ON public.shipment_containers
  FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM public.shipments s
    JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_containers.shipment_id
      AND public.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.shipments s
    JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_containers.shipment_id
      AND public.is_org_member(o.organization_id)
  ));

CREATE POLICY "shipment_packages_all" ON public.shipment_packages
  FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM public.shipment_containers sc
    JOIN public.shipments s ON s.id = sc.shipment_id
    JOIN public.orders o ON o.id = s.order_id
    WHERE sc.id = shipment_packages.container_id
      AND public.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.shipment_containers sc
    JOIN public.shipments s ON s.id = sc.shipment_id
    JOIN public.orders o ON o.id = s.order_id
    WHERE sc.id = shipment_packages.container_id
      AND public.is_org_member(o.organization_id)
  ));

CREATE POLICY "shipment_tracking_events_all" ON public.shipment_tracking_events
  FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM public.shipments s
    JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_tracking_events.shipment_id
      AND public.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.shipments s
    JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_tracking_events.shipment_id
      AND public.is_org_member(o.organization_id)
  ));

CREATE POLICY "document_versions_all" ON public.document_versions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
      AND public.is_org_member(d.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_versions.document_id
      AND public.is_org_member(d.organization_id)
  ));

CREATE POLICY "conversation_participants_all" ON public.conversation_participants
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND public.is_org_member(c.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND public.is_org_member(c.organization_id)
  ));

CREATE POLICY "messages_all" ON public.messages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND public.is_org_member(c.organization_id)
  ))
  WITH CHECK (
    sender_id = public.current_actor_id()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.is_org_member(c.organization_id)
    )
  );

-- Notifications are user-scoped rather than org-scoped.
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = public.current_actor_id());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE
  USING (user_id = public.current_actor_id())
  WITH CHECK (user_id = public.current_actor_id());

-- Internal event/audit records are only attributable to the current actor.
CREATE POLICY "outbox_events_actor" ON public.outbox_events
  FOR ALL
  USING (actor_id = public.current_actor_id())
  WITH CHECK (actor_id = public.current_actor_id());

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT
  USING (
    actor_id = public.current_actor_id()
    OR organization_id IS NULL
    OR public.is_org_member(organization_id)
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    actor_id = public.current_actor_id()
    AND (organization_id IS NULL OR public.is_org_member(organization_id))
  );

CREATE POLICY "audit_logs_update" ON public.audit_logs
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "audit_logs_delete" ON public.audit_logs
  FOR DELETE
  USING (false);
