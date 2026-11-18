// Cœur du calcul de pertinence entre articles, partagé par src/lib/related.ts
// (blocs « à lire ensuite ») et scripts/link-read-also.mjs (liens « À lire aussi »).
// JavaScript pur, sans dépendance Astro, pour pouvoir tourner dans un script Node.
/** @typedef {{ id: string; body?: string; data: { title: string; description?: string; tags: string[] } }} Post */

export const STOP = new Set(
  (
    // FR
    'avec aussi alors autre autres avant avoir bien cela celle celles celui cette ceux chez comme comment dans depuis donc elle elles encore entre etre fait faire font leur leurs mais meme moins notre nous nos plus pour pourquoi quand quel quelle quelles quels sans selon sont sous tous tout toute toutes tres vers votre vous vos ainsi afin dont faut peut peuvent cest quil quils etc chaque deux trois bonne bonnes bons meilleur meilleure meilleurs guide conseils article savoir lors permet permettent '
    // EN
    + 'about after also and are because been before being between both but can could does doing each even ever from have having here how into its just like more most much must need only other our ours over same should some such than that the their them then there these they this those through very want what when where which while who whom why will with without would you your yours best guide tips article make makes know'
  ).split(/\s+/),
);

const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

export function tokens(text) {
  return norm(text)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // liens markdown → texte
    .replace(/<[^>]+>/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w))
    .map((w) => w.replace(/(es|s|x)$/, '')); // racinisation grossière FR/EN
}

function vector(p) {
  const v = new Map();
  const add = (words, w) => words.forEach((t) => v.set(t, (v.get(t) ?? 0) + w));
  add(tokens(p.data.title), 4);
  add(tokens(p.data.description ?? ''), 2);
  add(tokens((p.body ?? '').slice(0, 4000)), 1);
  return v;
}

/** Matrice de similarité (cosinus TF-IDF + bonus de tags partagés). */
export function similarities(posts) {
  const vecs = posts.map(vector);
  const df = new Map();
  vecs.forEach((v) => v.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const n = posts.length;
  const w = vecs.map((v) => {
    const out = new Map();
    let norm2 = 0;
    v.forEach((tf, t) => {
      const x = Math.log(1 + tf) * Math.log(n / (df.get(t) ?? 1));
      if (x > 0) { out.set(t, x); norm2 += x * x; }
    });
    const len = Math.sqrt(norm2) || 1;
    out.forEach((x, t) => out.set(t, x / len));
    return out;
  });
  return posts.map((a, i) =>
    posts.map((b, j) => {
      if (i === j) return -1;
      let dot = 0;
      const [small, big] = w[i].size < w[j].size ? [w[i], w[j]] : [w[j], w[i]];
      small.forEach((x, t) => { const y = big.get(t); if (y) dot += x * y; });
      const shared = a.data.tags.filter((t) => b.data.tags.includes(t)).length;
      return dot + 0.06 * shared;
    }),
  );
}


/** Pour chaque article (index), les autres articles triés du plus proche au moins proche. */
export function rankAll(posts, sim = similarities(posts)) {
  return posts.map((_, i) => posts.map((_, j) => j).filter((j) => j !== i).sort((x, y) => sim[i][y] - sim[i][x] || x - y));
}

/**
 * Articles liés par index : les K-1 premiers sont les plus proches ; le dernier
 * est choisi parmi les 12 plus proches en favorisant ceux qui reçoivent encore
 * peu de liens ; un article orphelin prend la dernière place chez son voisin.
 */
export function pickRelated(posts, K = 3) {
  const sim = similarities(posts);
  const ranked = rankAll(posts, sim);
  const inbound = new Array(posts.length).fill(0);
  const picks = ranked.map((r) => r.slice(0, K - 1));
  picks.forEach((p) => p.forEach((j) => inbound[j]++));
  ranked.forEach((r, i) => {
    const pool = r.slice(K - 1, 12).filter((j) => !picks[i].includes(j));
    const best = pool.reduce((a, b) => (inbound[b] < inbound[a] ? b : a), pool[0]);
    if (best !== undefined) { picks[i].push(best); inbound[best]++; }
  });
  posts.forEach((_, o) => {
    if (inbound[o] > 0) return;
    const host = ranked[o].find((h) => {
      const last = picks[h][K - 1];
      return last !== undefined && last !== o && inbound[last] > 1 && !picks[h].includes(o);
    });
    if (host === undefined) return;
    inbound[picks[host][K - 1]]--;
    picks[host][K - 1] = o;
    inbound[o]++;
  });
  return { ranked, picks, sim };
}
