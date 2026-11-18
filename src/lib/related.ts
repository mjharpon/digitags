// Maillage « à lire ensuite » et « pour aller plus loin » calculé par pertinence.
//
// Avant : les 3 articles les plus récents du même tag. Résultat, les mêmes
// articles récents recevaient tous les liens et les anciens presque aucun (et
// en anglais, où une partie des articles n'a pas de tags, tout le monde pointait
// vers les 3 derniers articles).
//
// Ici : similarité TF-IDF (titre, description, début du corps) + tags partagés,
// puis un équilibrage pour que chaque article reçoive des liens. Le calcul est
// déterministe (tri par slug) : le maillage ne bouge pas d'un build à l'autre.
import { getCollection } from 'astro:content';

// @ts-ignore — module JS partagé avec scripts/link-read-also.mjs
import { pickRelated, tokens } from './related-core.mjs';

type Post = { id: string; body?: string; data: { title: string; description?: string; tags: string[]; draft?: boolean } };

const cache = new Map<string, Promise<Map<string, string[]>>>();

/**
 * Articles liés, par slug. K liens par article : les K-1 premiers sont les plus
 * proches ; le dernier est choisi parmi les 12 plus proches en favorisant les
 * articles qui reçoivent encore peu de liens. Enfin, un article qui n'en reçoit
 * aucun prend la dernière place chez son voisin le plus proche.
 */
export function relatedPostsMap(collection: 'blog' | 'blog-en', K = 3): Promise<Map<string, string[]>> {
  if (!cache.has(collection)) {
    cache.set(collection, (async () => {
      const posts = ((await getCollection(collection as 'blog', ({ data }) => !data.draft)) as unknown as Post[])
        .sort((a, b) => a.id.localeCompare(b.id));
      const { picks } = pickRelated(posts, K);
      return new Map(posts.map((p, i) => [p.id, picks[i].map((j) => posts[j].id)]));
    })());
  }
  return cache.get(collection)!;
}

/**
 * Articles à proposer depuis une fiche métier : d'abord ceux qui citent déjà la
 * fiche dans leur corps, puis ceux qui en parlent le plus (mots du titre de la
 * fiche), puis ceux de la même catégorie.
 */
export async function postsForMetier(
  collection: 'blog' | 'blog-en',
  ficheHref: string,
  ficheTitle: string,
  category: string | undefined,
  limit = 3,
): Promise<string[]> {
  const posts = ((await getCollection(collection as 'blog', ({ data }) => !data.draft)) as unknown as Post[])
    .sort((a, b) => a.id.localeCompare(b.id));
  const keys = tokens(ficheTitle).filter((t) => !['freelance', 'freelancer', 'expert', 'consultant'].includes(t));
  const score = (p: Post) => {
    const body = p.body ?? '';
    const linked = body.includes(`](${ficheHref})`) ? 100 : 0;
    const text = tokens(`${p.data.title} ${p.data.title} ${p.data.description ?? ''} ${body.slice(0, 6000)}`);
    const hits = keys.length ? text.filter((t) => keys.includes(t)).length / keys.length : 0;
    const cat = category && p.data.tags.includes(category) ? 2 : 0;
    return linked + Math.min(hits, 20) + cat;
  };
  return posts
    .map((p) => [p.id, score(p)] as const)
    .filter(([, s]) => s >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id]) => id);
}
