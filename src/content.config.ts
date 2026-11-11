import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const ficheSchema = z.object({
  title: z.string(),
  metaTitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  order: z.number().optional(),
  blogCategory: z.string().optional(),
  draft: z.boolean().default(false),
});

const metiers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/metiers' }),
  schema: ficheSchema,
});

// Fiches métiers en anglais (slugs SEO anglais, routées sous /en/roles/).
// Le mapping slug FR ↔ slug EN vit dans src/lib/i18n.ts (hreflang, sitemap).
const metiersEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/metiers-en' }),
  schema: ficheSchema,
});

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: ficheSchema,
});

const casClients = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cas-clients' }),
  schema: ficheSchema,
});

// Cas clients en anglais (/en/case-studies/<slug>), mapping dans src/lib/i18n.ts.
const casClientsEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cas-clients-en' }),
  schema: ficheSchema,
});

export const collections = { blog, metiers, 'metiers-en': metiersEn, projets, casClients, 'cas-clients-en': casClientsEn };
