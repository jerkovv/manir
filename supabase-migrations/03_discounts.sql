-- ============================================================
-- PHASE 5: Auto-popust po količini + Kupon kodovi
-- Pokreni u Supabase SQL Editoru
-- ============================================================

-- 1. Settings (key/value, jedan red po podešavanju)
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.store_settings enable row level security;

create policy "Anyone reads settings"
  on public.store_settings for select
  to anon, authenticated
  using (true);

create policy "Admins manage settings"
  on public.store_settings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Default: 3 komada = 20% popust, uključeno
insert into public.store_settings (key, value) values
  ('quantity_discount', '{"enabled": true, "min_quantity": 3, "percent": 20}'::jsonb)
on conflict (key) do nothing;

-- 2. Kuponi
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null,
  active boolean default true,
  uses_count int default 0,
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

-- Validacija po kodu (anyone, samo aktivni)
create policy "Anyone can validate active coupon"
  on public.coupons for select
  to anon, authenticated
  using (active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage coupons"
  on public.coupons for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3. Order discount fields
alter table public.orders
  add column if not exists subtotal numeric(10,2),
  add column if not exists discount_amount numeric(10,2) default 0,
  add column if not exists discount_label text,
  add column if not exists coupon_code text;
