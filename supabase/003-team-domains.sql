-- Accès à l'outil Talents par domaine email (en plus des emails individuels).
-- À exécuter dans Supabase : SQL Editor → coller → Run.

create table if not exists team_domains (
  domain text primary key,
  added_at timestamptz default now()
);

alter table team_domains enable row level security;
drop policy if exists team_read on team_domains;
create policy team_read on team_domains for select using (is_team());

insert into team_domains (domain) values
  ('donutz.fr'),
  ('donutzdigital.com'),
  ('digitags.work'),
  ('dgitags.com')
on conflict (domain) do nothing;

-- is_team() accepte désormais : email listé dans team_members OU domaine listé dans team_domains.
create or replace function is_team()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    exists (
      select 1 from team_members
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or exists (
      select 1 from team_domains
      where lower(domain) = lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2))
    );
$$;
