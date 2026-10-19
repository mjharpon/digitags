-- Nouveaux filtres (CDI, Salesforce) + recherche plein-texte dans les CV.
-- À exécuter dans Supabase : SQL Editor → coller → Run.

alter table profiles add column if not exists cdi boolean default false;
alter table profiles add column if not exists salesforce boolean default false;
alter table profiles add column if not exists cv_text text;
alter table profiles add column if not exists cv_fts tsvector
  generated always as (to_tsvector('french', coalesce(cv_text, ''))) stored;

create index if not exists profiles_cv_fts_idx on profiles using gin (cv_fts);
