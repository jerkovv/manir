-- ============================================================
-- 0202 SKIN — Phase 5: Email settings (SMTP) + email logs
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- email_settings (singleton row, id = 1)
-- ------------------------------------------------------------
create table if not exists public.email_settings (
  id              integer primary key default 1,
  smtp_host       text    not null default '',
  smtp_port       integer not null default 587,
  smtp_user       text    not null default '',
  smtp_password   text    not null default '',  -- enkriptovano sa pgp_sym_encrypt → base64
  smtp_secure     boolean not null default false,
  from_name       text    not null default '0202skin',
  from_email      text    not null default '',
  admin_email     text    not null default '',
  reply_to        text,
  customer_subject  text not null default 'Potvrda porudžbine #{orderId}',
  customer_template text not null default '',
  admin_subject     text not null default 'Nova porudžbina #{orderId}',
  admin_template    text not null default '',
  enabled         boolean not null default false,
  updated_at      timestamptz not null default now(),
  constraint email_settings_singleton check (id = 1)
);

alter table public.email_settings enable row level security;

drop policy if exists "Admins manage email settings" on public.email_settings;
create policy "Admins manage email settings"
  on public.email_settings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_email_settings()
returns trigger language plpgsql as $func$
begin new.updated_at = now(); return new; end;
$func$;

drop trigger if exists trg_email_settings_updated on public.email_settings;
create trigger trg_email_settings_updated
  before update on public.email_settings
  for each row execute function public.touch_email_settings();

-- ------------------------------------------------------------
-- VIEW koji NE vraća smtp_password (za admin UI load)
-- ------------------------------------------------------------
create or replace view public.email_settings_safe as
select
  id, smtp_host, smtp_port, smtp_user, smtp_secure,
  from_name, from_email, admin_email, reply_to,
  customer_subject, customer_template,
  admin_subject, admin_template,
  enabled, updated_at,
  (smtp_password is not null and length(smtp_password) > 0) as has_password
from public.email_settings;

grant select on public.email_settings_safe to authenticated;

-- ------------------------------------------------------------
-- Enkripcija lozinke (pgcrypto). Ključ se čita iz GUC-a
-- `app.settings.email_enc_key`. Postavi:
--   ALTER DATABASE postgres SET app.settings.email_enc_key = 'tvoj-tajni-string';
-- ------------------------------------------------------------
create or replace function public.encrypt_smtp_password(p_password text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $func$
declare k text;
begin
  if p_password is null or length(p_password) = 0 then
    return '';
  end if;
  k := current_setting('app.settings.email_enc_key', true);
  if k is null or length(k) = 0 then
    raise exception 'app.settings.email_enc_key nije postavljen na bazi';
  end if;
  return encode(pgp_sym_encrypt(p_password, k), 'base64');
end $func$;

create or replace function public.decrypt_smtp_password(p_cipher text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $func$
declare k text;
begin
  if p_cipher is null or length(p_cipher) = 0 then
    return '';
  end if;
  k := current_setting('app.settings.email_enc_key', true);
  if k is null or length(k) = 0 then
    raise exception 'app.settings.email_enc_key nije postavljen na bazi';
  end if;
  return pgp_sym_decrypt(decode(p_cipher, 'base64'), k);
end $func$;

revoke all on function public.decrypt_smtp_password(text) from public, anon, authenticated;

-- Admin RPC: upsert sa enkripcijom lozinke. Ako je p_password prazan,
-- postojeća lozinka ostaje netaknuta.
create or replace function public.upsert_email_settings(
  p_smtp_host text,
  p_smtp_port integer,
  p_smtp_user text,
  p_password text,
  p_smtp_secure boolean,
  p_from_name text,
  p_from_email text,
  p_admin_email text,
  p_reply_to text,
  p_customer_subject text,
  p_customer_template text,
  p_admin_subject text,
  p_admin_template text,
  p_enabled boolean
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $func$
declare new_pwd text;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  if p_password is null or length(p_password) = 0 then
    select smtp_password into new_pwd from public.email_settings where id = 1;
    if new_pwd is null then new_pwd := ''; end if;
  else
    new_pwd := public.encrypt_smtp_password(p_password);
  end if;

  insert into public.email_settings (
    id, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure,
    from_name, from_email, admin_email, reply_to,
    customer_subject, customer_template, admin_subject, admin_template, enabled
  ) values (
    1, p_smtp_host, p_smtp_port, p_smtp_user, new_pwd, p_smtp_secure,
    p_from_name, p_from_email, p_admin_email, p_reply_to,
    p_customer_subject, p_customer_template, p_admin_subject, p_admin_template, p_enabled
  )
  on conflict (id) do update set
    smtp_host         = excluded.smtp_host,
    smtp_port         = excluded.smtp_port,
    smtp_user         = excluded.smtp_user,
    smtp_password     = excluded.smtp_password,
    smtp_secure       = excluded.smtp_secure,
    from_name         = excluded.from_name,
    from_email        = excluded.from_email,
    admin_email       = excluded.admin_email,
    reply_to          = excluded.reply_to,
    customer_subject  = excluded.customer_subject,
    customer_template = excluded.customer_template,
    admin_subject     = excluded.admin_subject,
    admin_template    = excluded.admin_template,
    enabled           = excluded.enabled;
end $func$;

revoke all on function public.upsert_email_settings(
  text,integer,text,text,boolean,text,text,text,text,text,text,text,text,boolean
) from public, anon;
grant execute on function public.upsert_email_settings(
  text,integer,text,text,boolean,text,text,text,text,text,text,text,text,boolean
) to authenticated;

-- ------------------------------------------------------------
-- email_logs
-- ------------------------------------------------------------
create table if not exists public.email_logs (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid,
  recipient     text not null,
  type          text not null check (type in ('customer','admin','test')),
  status        text not null check (status in ('sent','failed')),
  error_message text,
  sent_at       timestamptz not null default now()
);

create index if not exists email_logs_sent_at_idx on public.email_logs (sent_at desc);
create index if not exists email_logs_order_id_idx on public.email_logs (order_id);

alter table public.email_logs enable row level security;

drop policy if exists "Admins read email logs" on public.email_logs;
create policy "Admins read email logs"
  on public.email_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Insert dolazi iz edge funkcija sa service role keyom (bypass RLS).

-- ------------------------------------------------------------
-- Default red sa default šablonima (samo prilikom prvog kreiranja)
-- ------------------------------------------------------------
insert into public.email_settings (id, customer_template, admin_template)
values (
  1,
  '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#FAFAF8;margin:0;padding:24px;color:#1a1a1a;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eee;"><tr><td style="padding:32px;"><h1 style="font-size:22px;margin:0 0 8px;">Hvala na porudžbini, {customerName}!</h1><p style="color:#555;margin:0 0 24px;">Vaša porudžbina je primljena. Broj porudžbine: <strong>#{orderId}</strong></p>{itemsTable}<p style="text-align:right;font-size:16px;margin:16px 0 0;"><strong>Ukupno: {total} RSD</strong></p><hr style="border:none;border-top:1px solid #eee;margin:24px 0;" /><p style="font-size:12px;color:#888;">Za sva pitanja, javite nam se na info@0202skin.com</p></td></tr></table></body></html>',
  '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#FAFAF8;margin:0;padding:24px;color:#1a1a1a;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eee;"><tr><td style="padding:32px;"><h1 style="font-size:22px;margin:0 0 8px;">Nova porudžbina #{orderId}</h1><p style="margin:0 0 4px;"><strong>Kupac:</strong> {customerName}</p><p style="margin:0 0 24px;"><strong>Email:</strong> {customerEmail}</p>{itemsTable}<p style="text-align:right;font-size:16px;margin:16px 0 0;"><strong>Ukupno: {total} RSD</strong></p></td></tr></table></body></html>'
)
on conflict (id) do nothing;
