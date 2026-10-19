-- Mot de passe simple par propale (protection du lien client).
-- À exécuter dans Supabase : SQL Editor → coller → Run.

alter table proposals add column if not exists password text;

comment on column proposals.password is
  'Mot de passe demandé au client sur /p/<token> (null = accès libre, anciennes propales).';
