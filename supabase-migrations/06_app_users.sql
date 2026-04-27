-- ============================================================
-- 0202 SKIN — Phase 1: app_users (interni tim) + audit log
-- Pokreni u Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. app_users TABELA
-- ============================================================

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null check (role in ('owner','admin','editor','viewer')),
  avatar_url text,
  status text not null default 'active' check (status in ('active','suspended','invited')),
  last_login_at timestamptz,
  invited_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_email on public.app_users(lower(email));
create index if not exists idx_app_users_role on public.app_users(role);
create index if not exists idx_app_users_status on public.app_users(status);

-- updated_at trigger (koristi postojeću touch_updated_at funkciju iz migracije 01)
drop trigger if exists trg_app_users_updated on public.app_users;
create trigger trg_app_users_updated
  before update on public.app_users
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. SECURITY DEFINER HELPER FUNKCIJE (sprečavaju RLS rekurziju)
-- ============================================================

create or replace function public.is_app_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and status = 'active'
  )
$$;

create or replace function public.app_user_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.app_users where id = auth.uid()
$$;

create or replace function public.has_app_permission(_perm text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case _perm
    when 'manage_users'    then public.app_user_role() in ('owner','admin')
    when 'manage_settings' then public.app_user_role() in ('owner','admin')
    when 'manage_products' then public.app_user_role() in ('owner','admin','editor')
    when 'manage_orders'   then public.app_user_role() in ('owner','admin','editor')
    when 'view_only'       then public.app_user_role() in ('owner','admin','editor','viewer')
    else false
  end
$$;

-- ============================================================
-- 3. RLS NA app_users
-- ============================================================

alter table public.app_users enable row level security;

drop policy if exists "app_users select" on public.app_users;
drop policy if exists "app_users insert" on public.app_users;
drop policy if exists "app_users update self" on public.app_users;
drop policy if exists "app_users update by manager" on public.app_users;
drop policy if exists "app_users delete owner" on public.app_users;

-- SELECT: svaki aktivan app_user vidi listu
create policy "app_users select"
  on public.app_users for select
  to authenticated
  using (public.is_app_user());

-- INSERT: samo owner i admin (kroz client; edge funkcija ide preko service role)
create policy "app_users insert"
  on public.app_users for insert
  to authenticated
  with check (public.has_app_permission('manage_users'));

-- UPDATE: korisnik može svoj red (full_name, avatar_url) — role/status zaštićeni triger-om
create policy "app_users update self"
  on public.app_users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- UPDATE: owner/admin može menjati druge
create policy "app_users update by manager"
  on public.app_users for update
  to authenticated
  using (public.has_app_permission('manage_users'))
  with check (public.has_app_permission('manage_users'));

-- DELETE: samo owner
create policy "app_users delete owner"
  on public.app_users for delete
  to authenticated
  using (public.app_user_role() = 'owner');

-- ============================================================
-- 4. ZAŠTITA: korisnik ne može sam sebi menjati role/status
-- ============================================================

create or replace function public.protect_self_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and (new.role <> old.role or new.status <> old.status) then
    -- dozvoli samo ako je kroz service_role (npr. iz edge funkcije)
    if current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' then
      raise exception 'Ne možete menjati svoju ulogu ili status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_users_protect_self on public.app_users;
create trigger trg_app_users_protect_self
  before update on public.app_users
  for each row execute function public.protect_self_role_change();

-- ============================================================
-- 5. user_audit_log TABELA
-- ============================================================

create table if not exists public.user_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.app_users(id) on delete set null,
  actor_email text,
  target_id uuid references public.app_users(id) on delete set null,
  target_email text,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created on public.user_audit_log(created_at desc);
create index if not exists idx_audit_log_actor on public.user_audit_log(actor_id);
create index if not exists idx_audit_log_target on public.user_audit_log(target_id);

alter table public.user_audit_log enable row level security;

drop policy if exists "audit log select managers" on public.user_audit_log;
drop policy if exists "audit log insert any app_user" on public.user_audit_log;

create policy "audit log select managers"
  on public.user_audit_log for select
  to authenticated
  using (public.has_app_permission('manage_users'));

-- INSERT dozvoljen svakom prijavljenom app_user-u (za login event); edge fn koristi service role
create policy "audit log insert any app_user"
  on public.user_audit_log for insert
  to authenticated
  with check (public.is_app_user() or auth.uid() = actor_id);

-- ============================================================
-- 6. INICIJALNI OWNER: jerkovdejan@icloud.com
-- ============================================================

-- Auto-promote: kad se taj email registruje, postaje owner
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'jerkovdejan@icloud.com' then
    insert into public.app_users (id, email, full_name, role, status)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Dejan Jerkov'), 'owner', 'active')
    on conflict (id) do update set role = 'owner', status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill: ako jerkovdejan@icloud.com već postoji u auth.users, ubaci ga sad
insert into public.app_users (id, email, full_name, role, status)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', 'Dejan Jerkov'), 'owner', 'active'
from auth.users u
where lower(u.email) = 'jerkovdejan@icloud.com'
on conflict (id) do update set role = 'owner', status = 'active';

-- ============================================================
-- 7. last_login_at ažuriranje (poziva se iz frontend-a posle login-a)
-- ============================================================

create or replace function public.app_user_record_login()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user record;
begin
  select * into v_user from public.app_users where id = auth.uid();
  if v_user.id is null then
    return; -- nije app_user
  end if;
  update public.app_users
    set last_login_at = now(),
        status = case when status = 'invited' then 'active' else status end
    where id = auth.uid();
  insert into public.user_audit_log (actor_id, actor_email, target_id, target_email, action)
  values (v_user.id, v_user.email, v_user.id, v_user.email, 'login');
end;
$$;

grant execute on function public.app_user_record_login() to authenticated;