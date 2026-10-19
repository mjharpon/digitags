-- Options de mission dans les propales : démarrage, durée, jours par semaine.
-- À exécuter dans Supabase : SQL Editor → coller → Run.

alter table proposals add column if not exists start_date date;
alter table proposals add column if not exists duration_weeks int default 4;
alter table proposal_items add column if not exists days_week numeric default 5;
