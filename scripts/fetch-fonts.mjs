// Télécharge les woff2 latin de Plus Jakarta Sans pour self-hosting.
// Usage : node scripts/fetch-fonts.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/assets/fonts', { recursive: true });
const cssUrl = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
const css = await (await fetch(cssUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
})).text();

// Blocs @font-face annotés /* latin */ uniquement.
const re = /\/\* latin \*\/\s*@font-face\s*{([^}]+)}/g;
let m;
let out = '';
while ((m = re.exec(css)) !== null) {
  const block = m[1];
  const weight = block.match(/font-weight:\s*(\d+)/)[1];
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const unicode = block.match(/unicode-range:\s*([^;]+);/)[1];
  const file = `pjs-${weight}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(`public/assets/fonts/${file}`, buf);
  out += `@font-face {\n  font-family: 'Plus Jakarta Sans';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/assets/fonts/${file}') format('woff2');\n  unicode-range: ${unicode};\n}\n`;
  console.log(file, (buf.length / 1024).toFixed(0) + ' Ko');
}
writeFileSync('public/assets/fonts/fonts.css', out);
console.log('fonts.css généré');
