-- Fiches clients : organiser les propales par client.
-- À exécuter dans Supabase : SQL Editor → coller → Run.

-- NB : pas d'espace client pour l'instant (décision MJ 2026-10-21).
-- Le jour venu, il suffira d'ajouter une colonne token (comme proposals.token),
-- sans toucher à cette table ni aux données.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  contact_name text,
  contact_email text,
  notes text,
  created_by text,
  created_at timestamptz default now(),
  archived boolean default false
);

alter table clients enable row level security;
drop policy if exists team_all on clients;
create policy team_all on clients for all using (is_team()) with check (is_team());

alter table proposals add column if not exists client_id uuid references clients(id);
create index if not exists proposals_client_idx on proposals (client_id);

comment on column proposals.client_name is
  'Texte libre historique — les nouvelles propales utilisent client_id (client_name sert de secours à l''affichage).';

-- Reprise : une fiche par client distinct déjà saisi en texte libre,
-- puis rattachement des propales existantes. Ré-exécutable sans doublon.
insert into clients (name)
select distinct on (lower(trim(client_name))) trim(client_name)
from proposals
where coalesce(trim(client_name), '') <> ''
  and not exists (
    select 1 from clients c where lower(c.name) = lower(trim(proposals.client_name))
  );

update proposals p
set client_id = c.id
from clients c
where p.client_id is null
  and lower(trim(coalesce(p.client_name, ''))) = lower(c.name);
