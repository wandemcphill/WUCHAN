-- 00008_quote_acceptance.sql

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS purchase_order_ref VARCHAR(100);
