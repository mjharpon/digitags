-- Durcissement suite à l'audit de sécurité du 14 nov. 2026.
-- À exécuter dans Supabase : SQL Editor → coller → Run. Relançable sans risque.

-- 1) Formulaire de contact : plus d'insertion publique directe.
--    Le site enregistre les demandes côté serveur (/api/contact, clé service,
--    avec contrôles de longueur et de format). La règle « public_insert »
--    permettait à n'importe qui d'écrire dans la table avec la clé publique,
--    sans passer par ces contrôles. L'équipe garde la lecture et le traitement.
drop policy if exists public_insert on contact_submissions;

-- 2) Buckets de fichiers : taille maximale (10 Mo) et formats acceptés, imposés
--    par Supabase lui-même en plus des contrôles du site. Ne concerne que les
--    NOUVEAUX envois : les fichiers déjà en place ne sont pas touchés.
--    photos        : photos de profil (JPEG, PNG, WebP).
--    docs-internes : CV, portfolios et briefs (PDF, images, Word, PowerPoint).
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'photos';

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array[
         'application/pdf',
         'image/jpeg',
         'image/png',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation'
       ]
 where id = 'docs-internes';

-- Contrôle : doit afficher les deux buckets avec leur limite et leurs formats.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id in ('photos', 'docs-internes');
