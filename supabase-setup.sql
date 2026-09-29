-- Hausblick: Einrichtung der gemeinsamen Datenbank-Tabelle in Supabase.
--
-- Anleitung:
-- 1. Im Supabase-Projekt links auf "SQL Editor" klicken.
-- 2. "New query" waehlen.
-- 3. Dieses komplette Skript einfuegen und auf "Run" klicken.
-- Das war's - die Tabelle ist danach fertig eingerichtet.

-- 1) Tabelle anlegen: eine einzige Zeile enthaelt den kompletten App-Zustand
--    (Personen, Aufgaben, Erledigungen, Preise, Einstellungen ...) als JSON.
create table if not exists public.hausblick_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) Row Level Security aktivieren (Pflicht in Supabase, damit Zugriff ueberhaupt
--    ueber Regeln statt "alles offen" gesteuert wird).
alter table public.hausblick_state enable row level security;

-- 3) Zugriffsregeln: Der "publishable" Key (im Code hinterlegt, ungefaehrlich)
--    darf diese eine Tabelle lesen und schreiben. Es gibt keine Logins/Passwoerter -
--    beide Personen teilen sich denselben Datensatz ueber diese App.
drop policy if exists "Hausblick lesen" on public.hausblick_state;
create policy "Hausblick lesen"
  on public.hausblick_state for select
  to anon, authenticated
  using (true);

drop policy if exists "Hausblick schreiben" on public.hausblick_state;
create policy "Hausblick schreiben"
  on public.hausblick_state for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Hausblick aktualisieren" on public.hausblick_state;
create policy "Hausblick aktualisieren"
  on public.hausblick_state for update
  to anon, authenticated
  using (true)
  with check (true);

-- 4) Live-Synchronisierung aktivieren, damit Aenderungen sofort auf beiden
--    Geraeten ankommen (Supabase Realtime). So geschrieben, dass ein
--    versehentliches zweites Ausfuehren des Skripts nicht zu einem Fehler fuehrt.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'hausblick_state'
  ) then
    alter publication supabase_realtime add table public.hausblick_state;
  end if;
end $$;
