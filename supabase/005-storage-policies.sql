-- Accès de l'équipe aux documents internes (bucket privé docs-internes).
-- À exécuter dans Supabase : SQL Editor → coller → Run.

drop policy if exists team_read_docs_internes on storage.objects;
create policy team_read_docs_internes on storage.objects
  for select using (bucket_id = 'docs-internes' and is_team());
