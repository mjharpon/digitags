// Télécharge le woff2 latin de Plus Jakarta Sans pour self-hosting.
// Google Fonts sert le même fichier variable (axe wght) pour toutes les
// graisses : on n'en garde qu'un, déclaré une seule fois en tête de
// src/styles/global.css avec `font-weight: 400 800`.
// Le fichier est servi en cache immuable (public/_headers) : s'il change,
// changer aussi son nom (CSS + preload de src/layouts/Base.astro).
// Usage : node scripts/fetch-fonts.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const FILE = 'public/assets/fonts/pjs-variable.woff2';

mkdirSync('public/assets/fonts', { recursive: true });
const cssUrl = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&display=swap';
const css = await (await fetch(cssUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
})).text();

// Bloc @font-face annoté /* latin */ uniquement.
const block = css.match(/\/\* latin \*\/\s*@font-face\s*{([^}]+)}/)?.[1];
if (!block) throw new Error('Bloc latin introuvable dans la feuille Google Fonts');
const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
const unicode = block.match(/unicode-range:\s*([^;]+);/)[1];
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
writeFileSync(FILE, buf);
console.log(FILE, (buf.length / 1024).toFixed(0) + ' Ko');
console.log('unicode-range à reporter dans global.css si besoin :', unicode);
