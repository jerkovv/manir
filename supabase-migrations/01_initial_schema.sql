-- ============================================================
-- 0202 SKIN — Phase 1: Initial Schema
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. ROLES SYSTEM (security-critical: roles in separate table)
-- ============================================================

create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. PRODUCTS
-- ============================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  images text[] default '{}',
  stock_status text default 'in_stock',
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Anyone can view visible products"
  on public.products for select
  to anon, authenticated
  using (visible = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage products"
  on public.products for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. CUSTOMERS (public-facing buyers — separate from auth.users)
-- ============================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text default 'Srbija',
  total_orders int default 0,
  created_at timestamptz default now()
);

alter table public.customers enable row level security;

create policy "Anyone can insert customer (checkout)"
  on public.customers for insert
  to anon, authenticated
  with check (true);

create policy "Admins view all customers"
  on public.customers for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage customers"
  on public.customers for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. ORDERS
-- ============================================================

create type public.order_status as enum ('pending', 'shipped', 'delivered', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  total numeric(10,2) not null,
  status order_status default 'pending',
  notes text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  review_email_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Anyone can insert order (checkout)"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "Admins view all orders"
  on public.orders for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage orders"
  on public.orders for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. ORDER ITEMS
-- ============================================================

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  quantity int not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table public.order_items enable row level security;

create policy "Anyone can insert order items (checkout)"
  on public.order_items for insert
  to anon, authenticated
  with check (true);

create policy "Admins view all order items"
  on public.order_items for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. REVIEWS
-- ============================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  reviewer_name text not null,
  reviewer_email text,
  rating int not null check (rating between 1 and 5),
  review_text text not null,
  verified_purchase boolean default false,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can view approved reviews"
  on public.reviews for select
  to anon, authenticated
  using (approved = true or public.has_role(auth.uid(), 'admin'));

create policy "Anyone can submit a review"
  on public.reviews for insert
  to anon, authenticated
  with check (true);

create policy "Admins manage reviews"
  on public.reviews for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. BLOG POSTS
-- ============================================================

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text,
  featured_image text,
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;

create policy "Anyone reads published posts"
  on public.blog_posts for select
  to anon, authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage posts"
  on public.blog_posts for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 8. STANDALONE PAGES
-- ============================================================

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text,
  featured_image text,
  meta_title text,
  meta_description text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pages enable row level security;

create policy "Anyone reads published pages"
  on public.pages for select
  to anon, authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage pages"
  on public.pages for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 9. LANDING PAGE SECTIONS (Content Editor)
-- ============================================================

create table public.landing_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null, -- hero, text_block, image_text, product_feature, testimonial, custom_html
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_text text,
  cta_url text,
  custom_html text,
  position int not null default 0,
  visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.landing_sections enable row level security;

create policy "Anyone reads visible sections"
  on public.landing_sections for select
  to anon, authenticated
  using (visible = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage sections"
  on public.landing_sections for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger trg_blog_posts_updated before update on public.blog_posts
  for each row execute function public.touch_updated_at();
create trigger trg_pages_updated before update on public.pages
  for each row execute function public.touch_updated_at();
create trigger trg_landing_sections_updated before update on public.landing_sections
  for each row execute function public.touch_updated_at();
