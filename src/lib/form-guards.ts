// Garde-fous communs aux endpoints de formulaire (/api/candidature, /api/contact)
// et aux pages rendues à la demande (/p/<token>, /c/<token>).

// Secrets serveur : en production, uniquement les variables du runtime Cloudflare
// (locals.runtime.env). Le repli sur import.meta.env ne sert qu'au serveur de
// développement — ainsi un build ne peut plus embarquer la valeur d'un secret.
export function serverEnv(locals: unknown) {
  const env = (locals as any)?.runtime?.env ?? {};
  const dev = import.meta.env.DEV;
  return {
    SUPABASE_URL: (env.SUPABASE_URL ?? (dev ? import.meta.env.SUPABASE_URL : undefined)) as string | undefined,
    SUPABASE_SERVICE_KEY: (env.SUPABASE_SERVICE_KEY ?? (dev ? import.meta.env.SUPABASE_SERVICE_KEY : undefined)) as string | undefined,
    NOTIFY_SECRET: (env.NOTIFY_SECRET ?? (dev ? import.meta.env.NOTIFY_SECRET : undefined)) as string | undefined,
    RESEND_API_KEY: (env.RESEND_API_KEY ?? (dev ? import.meta.env.RESEND_API_KEY : undefined)) as string | undefined,
  };
}

// Longueurs maximales acceptées côté serveur (les formulaires portent les mêmes
// valeurs en `maxlength`).
export const MAX = {
  prenom: 80,
  nom: 80,
  job: 120,
  email: 254,
  societe: 120,
  choix: 120, // listes déroulantes (spécialité, expertise)
  references: 500,
  url: 500,
  texte: 5000, // notes, message
} as const;

export const hasAngle = (s: string) => /[<>]/.test(s);
export const isEmail = (s: string) => s.length <= MAX.email && /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(s);
export const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s) && s.length <= MAX.url;

// En-têtes de sécurité des pages privées rendues à la demande : `public/_headers`
// ne s'applique qu'aux fichiers statiques, pas aux réponses du Pages Function.
export const PRIVATE_PAGE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

// Données passées à un script de page : JSON inerte dans une balise
// <script type="application/json">. « < » est neutralisé pour qu'aucune valeur
// ne puisse refermer la balise (</script>, </SCRIPT>, <!--…).
export const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

// --- Fichiers envoyés : le type MIME déclaré ne suffit pas, on contrôle la
// signature (« octets magiques ») du contenu.
export const MIN_FILE_SIZE = 100; // octets

const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);
const ZIP = [0x50, 0x4b, 0x03, 0x04]; // .docx, .pptx
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // .doc, .ppt
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  // %PDF- : en tout début de fichier, ou précédé de quelques octets parasites
  // (toléré par les lecteurs PDF dans les 1024 premiers octets).
  'application/pdf': (b) => {
    const sig = [0x25, 0x50, 0x44, 0x46, 0x2d];
    for (let i = 0; i + sig.length <= b.length; i++) {
      if (sig.every((v, k) => b[i + k] === v)) return true;
    }
    return false;
  },
  'image/jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  'image/png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]),
  'application/msword': (b) => startsWith(b, OLE),
  'application/vnd.ms-powerpoint': (b) => startsWith(b, OLE),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) => startsWith(b, ZIP),
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': (b) => startsWith(b, ZIP),
};

export type FileProblem = 'size' | 'empty' | 'type' | null;

// Vérifie taille, type déclaré et signature du contenu. null = fichier accepté.
export async function checkFile(file: File, allowed: string[], maxSize: number): Promise<FileProblem> {
  if (file.size > maxSize) return 'size';
  if (file.size < MIN_FILE_SIZE) return 'empty';
  const matches = SIGNATURES[file.type];
  if (!allowed.includes(file.type) || !matches) return 'type';
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return matches(head) ? null : 'type';
}
