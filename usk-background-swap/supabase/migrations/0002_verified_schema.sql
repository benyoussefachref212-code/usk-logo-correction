-- Verified schema-only portability export for the existing Supabase project.
-- This migration creates structure only; it does not copy application data.
-- Do not run against the existing production project.

create table if not exists public.usk_teams (
  id text primary key,
  abbreviation text not null,
  name text not null,
  logo_path text,
  colors text not null,
  accent text not null,
  stadium text not null,
  city text not null,
  competition text not null,
  group_name text not null,
  season text not null,
  identity jsonb not null default '{}'::jsonb,
  virtual_kit jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usk_matches (
  id text primary key,
  date date not null,
  time text not null,
  home_team_id text references public.usk_teams(id) on delete set null,
  opponent_team_id text references public.usk_teams(id) on delete set null,
  opponent text not null,
  opponent_short text not null,
  opponent_logo_path text,
  competition text not null,
  home boolean not null default true,
  stadium text not null,
  status text not null default 'upcoming'::text,
  score_for integer,
  score_against integer,
  started_at timestamptz,
  paused_at timestamptz,
  elapsed_seconds integer,
  result text,
  referee text,
  assistant_referee_1 text,
  assistant_referee_2 text,
  fourth_referee text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.usk_official_kits (
  slot text primary key,
  label text not null,
  title text not null,
  description text not null,
  image_path text,
  status text not null default 'draft'::text,
  updated_at timestamptz,
  generated_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists usk_matches_date_idx on public.usk_matches (date);
create index if not exists usk_matches_status_idx on public.usk_matches (status);

alter table public.usk_teams enable row level security;
alter table public.usk_matches enable row level security;
alter table public.usk_official_kits enable row level security;

drop policy if exists "usk_teams_public_read" on public.usk_teams;
create policy "usk_teams_public_read" on public.usk_teams for select to anon, authenticated using (true);
drop policy if exists "usk_teams_app_write" on public.usk_teams;
create policy "usk_teams_app_write" on public.usk_teams for all to anon, authenticated using (true) with check (true);

drop policy if exists "Public can read matches" on public.usk_matches;
create policy "Public can read matches" on public.usk_matches for select to anon, authenticated using (true);
drop policy if exists "Public can manage matches" on public.usk_matches;
create policy "Public can manage matches" on public.usk_matches for all to anon, authenticated using (true) with check (true);

drop policy if exists "usk_official_kits_public_read" on public.usk_official_kits;
create policy "usk_official_kits_public_read" on public.usk_official_kits for select to anon, authenticated using (true);
drop policy if exists "usk_official_kits_app_write" on public.usk_official_kits;
create policy "usk_official_kits_app_write" on public.usk_official_kits for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'usk-assets',
  'usk-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "usk_assets_public_read" on storage.objects;
create policy "usk_assets_public_read" on storage.objects for select to anon, authenticated using (bucket_id = 'usk-assets');
drop policy if exists "usk_assets_app_upload" on storage.objects;
create policy "usk_assets_app_upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'usk-assets');
drop policy if exists "usk_assets_app_update" on storage.objects;
create policy "usk_assets_app_update" on storage.objects for update to anon, authenticated using (bucket_id = 'usk-assets') with check (bucket_id = 'usk-assets');

-- Data and storage objects must be transferred separately from the source project.
-- The source project currently contains additional application state referenced
-- by the frontend but not present in the verified public schema export.
