-- Espace client : lien privé à jeton (/c/<token>) listant les propales du client.
-- À exécuter dans Supabase : SQL Editor → coller → Run.

alter table clients add column if not exists token text unique
  default encode(gen_random_bytes(16), 'hex');

-- Sécurité : les anciennes lignes reçoivent la valeur par défaut à l'ajout de
-- la colonne ; cette mise à jour couvre tout reliquat éventuel.
update clients set token = encode(gen_random_bytes(16), 'hex') where token is null;
