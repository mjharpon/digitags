// Restaure dans le Storage Supabase des fichiers depuis la sauvegarde locale créée par
// compress-storage.mjs (~/digitags-storage-backup).
//
// Usage :
//   node --env-file=.env scripts/restore-storage.mjs docs-internes/<id>/cv.pdf [autre/chemin …]
//   node --env-file=.env scripts/restore-storage.mjs --list=fichier.txt   (un chemin par ligne)
//   option : --backup=/chemin  (défaut ~/digitags-storage-backup)
// Le fichier est renvoyé tel quel (même chemin, x-upsert), et noté dans skip.json pour que
// compress-storage.mjs ne le retouche plus.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { SUPABASE_URL: U, SUPABASE_SERVICE_KEY: K } = process.env;
if (!U || !K) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants (--env-file=.env)');
const H = { apikey: K, Authorization: `Bearer ${K}` };

const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const BACKUP = arg('backup', path.join(os.homedir(), 'digitags-storage-backup'));
const listFile = arg('list', null);
const ids = [
  ...process.argv.slice(2).filter((a) => !a.startsWith('--')),
  ...(listFile ? readFileSync(listFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : []),
];
if (!ids.length) throw new Error('Aucun chemin donné.');

const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const SKIP_FILE = path.join(BACKUP, 'skip.json');
const skip = new Set(existsSync(SKIP_FILE) ? JSON.parse(readFileSync(SKIP_FILE, 'utf8')) : []);

let ok = 0;
for (const id of ids) {
  const file = path.join(BACKUP, id);
  if (!existsSync(file)) { console.log(`  ! ${id} : pas de sauvegarde locale, ignoré`); continue; }
  const body = readFileSync(file);
  const ext = id.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? 'pdf';
  const res = await fetch(`${U}/storage/v1/object/${id}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'x-upsert': 'true' },
    body,
  });
  if (res.ok) { skip.add(id); ok++; console.log(`  ✓ ${id} restauré (${(body.length / 1048576).toFixed(1)} Mo)`); }
  else console.log(`  ! ${id} : envoi ${res.status} ${(await res.text()).slice(0, 80)}`);
}
writeFileSync(SKIP_FILE, JSON.stringify([...skip]));
console.log(`\n${ok}/${ids.length} fichiers restaurés.`);
