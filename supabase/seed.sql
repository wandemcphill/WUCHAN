-- Seed script for WUCHAN platform foundation and initial commercial vertical slice

-- 1. Profiles
INSERT INTO public.profiles (id, email, full_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@wuchan.com', 'Platform Admin'),
  ('00000000-0000-0000-0000-000000000002', 'factory@wuchan.com', 'Factory Manager'),
  ('00000000-0000-0000-0000-000000000003', 'buyer@wuchan.com', 'Customer Buyer')
ON CONFLICT (id) DO NOTHING;

-- 2. Organizations
INSERT INTO public.organizations (id, name, slug, type, country_code)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'WUCHAN Global Platform', 'wuchan-platform', 'PLATFORM', 'US'),
  ('22222222-2222-2222-2222-222222222222', 'Zenith Prefab Factory Ltd', 'zenith-prefab', 'FACTORY', 'CN'),
  ('33333333-3333-3333-3333-333333333333', 'Pacific Modular Developments', 'pacific-modular', 'CUSTOMER', 'AU')
ON CONFLICT (id) DO NOTHING;

-- 3. Memberships
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'PLATFORM_ADMIN'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'FACTORY_MANAGER'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'CUSTOMER_BUYER')
ON CONFLICT DO NOTHING;

-- 4. Products
INSERT INTO public.products (id, organization_id, name, sku, description, base_price_cents, currency, lead_time_days)
VALUES
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'Prefab Cabin Horizon Alpha', 'CABIN-HORIZON-A', 'Luxury 2-bedroom modular steel cabin', 4500000, 'USD', 45),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Glamping Pod Eco 30', 'POD-ECO-30', 'Fully insulated eco glamping pod unit', 1850000, 'USD', 30)
ON CONFLICT (id) DO NOTHING;
