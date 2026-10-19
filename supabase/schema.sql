-- Schéma de l'outil Talents digitags.work
-- À exécuter dans Supabase : SQL Editor → coller → Run.

-- ===== Tables =====

create table if not exists job_groups (
  id uuid primary key default gen_random_uuid(),
  webflow_id text unique,
  name text not null,
  slug text,
  sort int default 0
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  webflow_id text unique,
  name text not null,
  slug text,
  email text,
  job text,
  job_group_id uuid references job_groups(id),
  photo_url text,
  disponible boolean default false,
  dispo_from date,
  fluent_english boolean,
  dgitags_experience text,
  experience text,
  stars numeric,
  tarif_jour numeric,
  tjm_free numeric,
  salary text,
  preferences_html text,
  reference_html text,
  formation_html text,
  notes_html text,
  notes_tags_html text,
  cv_url text,
  cv_anonyme_url text,
  portfolio_url text,
  portfolio_pdf_url text,
  show_on_website boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_name_job_idx on profiles using gin (
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(job, ''))
);
create index if not exists profiles_job_group_idx on profiles (job_group_id);
create index if not exists profiles_disponible_idx on profiles (disponible);

-- Membres de l'équipe autorisés à utiliser l'outil interne.
create table if not exists team_members (
  email text primary key,
  name text,
  added_at timestamptz default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  title text not null,
  client_name text,
  intro text,
  created_by text,
  created_at timestamptz default now(),
  archived boolean default false
);

create table if not exists proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role_label text,
  tjm numeric,
  note text,
  sort int default 0
);

-- ===== Sécurité (RLS) =====
-- Principe : tout est fermé par défaut. Seuls les membres de l'équipe
-- (table team_members) accèdent aux données via l'app /talents.
-- Les pages propales publiques (/p/<token>) sont rendues côté serveur
-- avec la clé service_role : aucune policy publique n'est nécessaire.

alter table job_groups enable row level security;
alter table profiles enable row level security;
alter table team_members enable row level security;
alter table proposals enable row level security;
alter table proposal_items enable row level security;

create or replace function is_team()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists team_all on job_groups;
create policy team_all on job_groups for all using (is_team()) with check (is_team());

drop policy if exists team_all on profiles;
create policy team_all on profiles for all using (is_team()) with check (is_team());

drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (is_team());

drop policy if exists team_all on proposals;
create policy team_all on proposals for all using (is_team()) with check (is_team());

drop policy if exists team_all on proposal_items;
create policy team_all on proposal_items for all using (is_team()) with check (is_team());

-- ===== Amorçage =====
insert into team_members (email, name) values ('mj@donutz.fr', 'MJ')
on conflict (email) do nothing;
