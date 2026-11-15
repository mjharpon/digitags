// Génère l'image de partage par défaut (Open Graph / Twitter), 1200×630 :
// logo + nom de marque sur fond navy → public/assets/og-default.png (versionné).
// À relancer seulement si le logo change ; les articles de blog utilisent
// leur image de couverture (src/components/BlogPost.astro).
//
// Le gabarit scripts/og-default.html est rendu par Chrome sans interface, parce
// que sharp ne sait pas dessiner du texte avec la police du site (woff2) ;
// sharp recadre ensuite le rendu à la taille exacte et compresse le PNG.
// Usage : node scripts/build-og-image.mjs   (Chrome requis ; CHROME_PATH pour un autre chemin)
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const OUT = 'public/assets/og-default.png';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) throw new Error(`Chrome introuvable (${CHROME}) : renseigner CHROME_PATH`);

const tmp = mkdtempSync(join(tmpdir(), 'og-image-'));
const shot = join(tmp, 'shot.png');
const run = spawnSync(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${join(tmp, 'profile')}`,
    `--window-size=${W},${H}`,
    '--virtual-time-budget=3000', // laisse la police se charger avant la capture
    `--screenshot=${shot}`,
    pathToFileURL(resolve('scripts/og-default.html')).href,
  ],
  { stdio: 'ignore', timeout: 60000 }
);
if (run.status !== 0 || !existsSync(shot)) throw new Error('La capture Chrome a échoué');

await sharp(shot)
  .extract({ left: 0, top: 0, width: W, height: H })
  .png({ compressionLevel: 9, palette: true, colours: 128 })
  .toFile(OUT);
rmSync(tmp, { recursive: true, force: true });

const meta = await sharp(OUT).metadata();
console.log(`${OUT} : ${meta.width}×${meta.height}, ${(readFileSync(OUT).length / 1024).toFixed(1)} Ko`);
