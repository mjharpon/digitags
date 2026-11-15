// Plugins markdown branchés dans astro.config.mjs, limités aux articles de blog
// (src/content/blog et src/content/blog-en).
//
// Les fiches métiers / projets / cas clients sont volontairement exclues :
// FicheMetier.astro et FicheProjet.astro découpent le HTML rendu sur les <h2>
// et repèrent les <img> par expression régulière — leur HTML ne doit pas bouger.

const isBlogPost = (file) => /\/src\/content\/blog(-en)?\//.test((file?.path ?? '').replace(/\\/g, '/'));

const walk = (node, fn) => {
  fn(node);
  if (Array.isArray(node.children)) for (const child of node.children) walk(child, fn);
};

// Le <h1> de la page est le titre du frontmatter (BlogPost.astro) : un « # » dans
// le corps de l'article est rétrogradé en <h2> pour garder un seul H1 par page.
export function remarkSingleH1() {
  return (tree, file) => {
    if (!isBlogPost(file)) return;
    walk(tree, (node) => {
      if (node.type === 'heading' && node.depth === 1) node.depth = 2;
    });
  };
}

// Images du corps des articles : chargement différé et décodage asynchrone.
// La première image reste en chargement normal, elle peut être visible dès
// l'arrivée sur la page (candidate au LCP).
export function rehypeLazyImages() {
  return (tree, file) => {
    if (!isBlogPost(file)) return;
    let first = true;
    walk(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      node.properties ??= {};
      node.properties.decoding = 'async';
      if (!first) node.properties.loading = 'lazy';
      first = false;
    });
  };
}
