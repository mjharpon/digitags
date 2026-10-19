-- Soumissions du formulaire de contact (remplace Netlify Forms).
-- À exécuter dans Supabase : SQL Editor → coller → Run.

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  profil text,
  nom text,
  email text,
  societe text,
  expertise text,
  message text,
  handled boolean default false
);

alter table contact_submissions enable row level security;

-- Tout le monde peut soumettre le formulaire (insertion seule, jamais de lecture publique).
drop policy if exists public_insert on contact_submissions;
create policy public_insert on contact_submissions for insert with check (true);

-- L'équipe lit et traite les soumissions.
drop policy if exists team_read on contact_submissions;
create policy team_read on contact_submissions for select using (is_team());
drop policy if exists team_update on contact_submissions;
create policy team_update on contact_submissions for update using (is_team()) with check (is_team());
