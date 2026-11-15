// Tris déterministes des collections de contenu.
// getCollection() ne garantit pas l'ordre des entrées d'un build à l'autre : sans
// départage, deux entrées à égalité (même date, même `order`, ou pas de tri du
// tout) changeaient de place à chaque déploiement, et avec elles les blocs
// « métiers liés » / « à lire ensuite » — donc le maillage interne. À égalité,
// on départage toujours par l'identifiant (le slug).
type Entry = { id: string; data: { order?: number; date?: Date } };

/** Champ `order` croissant (les entrées sans `order` en dernier), puis slug. */
export const byOrder = (a: Entry, b: Entry) =>
  (a.data.order ?? 999) - (b.data.order ?? 999) || a.id.localeCompare(b.id);

/** Du plus récent au plus ancien, puis slug. */
export const byDateDesc = (a: Entry, b: Entry) =>
  (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0) || a.id.localeCompare(b.id);
