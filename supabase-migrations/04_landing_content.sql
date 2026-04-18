-- ============================================================
-- 0202 SKIN — Phase 4: Landing page content
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.landing_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.landing_content enable row level security;

create policy "Anyone can read landing content"
  on public.landing_content for select
  to anon, authenticated
  using (true);

create policy "Admins can manage landing content"
  on public.landing_content for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Default sections
insert into public.landing_content (key, data) values
('hero', jsonb_build_object(
  'eyebrow', 'Premium Skincare',
  'titleLine1', 'Ritual nege.',
  'titleLine2', 'Nauka i priroda.',
  'subtitle', 'Kozmetika nastala iz ljubavi prema koži i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.',
  'ctaPrimaryLabel', 'Poručite ovde',
  'ctaPrimaryLink', '/prodavnica',
  'ctaSecondaryLabel', 'Naša priča',
  'ctaSecondaryLink', '/o-nama',
  'image', ''
)),
('offer', jsonb_build_object(
  'eyebrow', 'Trenutna ponuda',
  'image', '',
  'link', '/prodavnica',
  'enabled', true
)),
('brand_intro', jsonb_build_object(
  'eyebrow', 'O brendu',
  'title', 'Spoj nauke i prirode u službi vaše kože',
  'paragraph1', '0202 SKIN je kozmetika nastala iz ljubavi prema koži i želje da ponudi stvarna rešenja za savremene probleme i stanja kože.',
  'paragraph2', 'Kombinujući znanje farmacije i iskustvo profesionalnih kozmetičara, razvijamo formule koje ciljano deluju na uzrok, a ne samo na posledice.',
  'paragraph3', 'Ali 0202 SKIN je više od kozmetike. To je ritual nege, trenutak koji posvećujete sebi. Self care koji nije luksuz, već potreba.',
  'quote', 'Negovana koža nije slučajnost. Ona je rezultat pažnje, znanja i ljubavi prema sebi.',
  'badgeNumber', '15+',
  'badgeLabel', 'Godina iskustva u kozmetičkoj praksi',
  'image', ''
)),
('selfcare', jsonb_build_object(
  'eyebrow', 'Ritual',
  'title', 'Kada usporite, počinje prava promena',
  'subtitle', 'Kada birate šta stavljate na svoju kožu i kako se odnosite prema sebi — to je trenutak u kome se rađa lepota. 0202 SKIN je vaš svakodnevni ritual nege.',
  'ctaLabel', 'Otkrijte kolekciju',
  'ctaLink', '/prodavnica',
  'image', ''
)),
('final_cta', jsonb_build_object(
  'eyebrow', '0202 SKIN',
  'title', 'Vaša koža zaslužuje najbolje',
  'subtitle', 'Otkrijte premium skincare kolekciju zasnovanu na nauci, stručnosti i ljubavi prema koži.',
  'ctaPrimaryLabel', 'Prodavnica',
  'ctaPrimaryLink', '/prodavnica',
  'ctaSecondaryLabel', 'Kontaktirajte nas',
  'ctaSecondaryLink', '/kontakt'
))
on conflict (key) do nothing;

-- Update trigger
create or replace function public.touch_landing_content()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_landing_content_updated on public.landing_content;
create trigger trg_landing_content_updated
  before update on public.landing_content
  for each row execute function public.touch_landing_content();
