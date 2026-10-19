// Réception des inscriptions freelance (formulaire /devenir-freelance).
// Valide, téléverse les fichiers (CV/portfolio → bucket privé, photo → bucket public)
// et crée la fiche dans la table profiles. Exécuté côté serveur (clé service).
export const prerender = false;

import type { APIRoute } from 'astro';

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const IMG_TYPES = ['image/jpeg', 'image/png'];

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any)?.runtime?.env ?? {};
  const url = env.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY ?? import.meta.env.SUPABASE_SERVICE_KEY;
  const H = { apikey: key, Authorization: `Bearer ${key}` };
  const json = (status: number, body: object) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'Formulaire invalide.' });
  }

  // Piège anti-robots : champ caché qui doit rester vide.
  if (form.get('website')) return json(200, { ok: true });

  const get = (k: string) => String(form.get(k) ?? '').trim();
  const prenom = get('prenom');
  const nom = get('nom');
  const email = get('email');
  const tjm = Number(get('tjm'));
  const dispo = get('dispo');
  const specialite = get('specialite');
  const job = get('job');

  if (!prenom || !nom || !email || !tjm || !dispo || !specialite || !job) {
    return json(400, { ok: false, error: 'Merci de remplir tous les champs obligatoires.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { ok: false, error: 'Adresse email invalide.' });
  }

  const cv = form.get('cv') as File | null;
  if (!cv || cv.size === 0) return json(400, { ok: false, error: 'Le CV est obligatoire.' });

  const files: { field: string; file: File; types: string[] }[] = [
    { field: 'cv', file: cv, types: DOC_TYPES },
  ];
  const photo = form.get('photo') as File | null;
  if (photo && photo.size > 0) files.push({ field: 'photo', file: photo, types: IMG_TYPES });
  const portfolioPdf = form.get('portfolio_pdf') as File | null;
  if (portfolioPdf && portfolioPdf.size > 0) files.push({ field: 'portfolio_pdf', file: portfolioPdf, types: DOC_TYPES });

  for (const f of files) {
    if (f.file.size > MAX_SIZE) return json(400, { ok: false, error: `Fichier « ${f.field} » trop lourd (10 Mo max).` });
    if (!f.types.includes(f.file.type)) return json(400, { ok: false, error: `Format non accepté pour « ${f.field} ».` });
  }

  // Résolution de la spécialité → famille de métiers.
  let jobGroupId: string | null = null;
  try {
    const groups = await (await fetch(`${url}/rest/v1/job_groups?select=id,name`, { headers: H })).json();
    jobGroupId = groups.find((g: any) => g.name === specialite)?.id ?? null;
  } catch { /* la fiche reste valable sans famille */ }

  // Téléversement des fichiers.
  const id = crypto.randomUUID();
  const extOf = (f: File, fallback: string) =>
    ({ 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[f.type] ?? fallback);
  const upload = async (bucket: string, path: string, file: File) => {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': file.type, 'x-upsert': 'true' },
      body: await file.arrayBuffer(),
    });
    if (!res.ok) throw new Error(`upload ${bucket}/${path}: ${res.status}`);
  };

  let cvPath: string | null = null;
  let photoUrl: string | null = null;
  let portfolioPath: string | null = null;
  try {
    cvPath = `docs-internes/candidatures/${id}/cv.${extOf(cv, 'pdf')}`;
    await upload('docs-internes', `candidatures/${id}/cv.${extOf(cv, 'pdf')}`, cv);
    if (photo && photo.size > 0) {
      await upload('photos', `candidatures/${id}/photo.${extOf(photo, 'jpg')}`, photo);
      photoUrl = `${url}/storage/v1/object/public/photos/candidatures/${id}/photo.${extOf(photo, 'jpg')}`;
    }
    if (portfolioPdf && portfolioPdf.size > 0) {
      portfolioPath = `docs-internes/candidatures/${id}/portfolio.${extOf(portfolioPdf, 'pdf')}`;
      await upload('docs-internes', `candidatures/${id}/portfolio.${extOf(portfolioPdf, 'pdf')}`, portfolioPdf);
    }
  } catch {
    return json(500, { ok: false, error: "L'envoi des fichiers a échoué — réessayez ou écrivez-nous." });
  }

  // Références clients → HTML simple.
  const references = get('references');
  const referenceHtml = references
    ? references.split(/[,;\n]/).map((r) => r.trim()).filter(Boolean).map((r) => `<p>${esc(r)}</p>`).join('')
    : null;
  const notes = get('notes');

  const row = {
    name: `${prenom} ${nom}`,
    email,
    job,
    job_group_id: jobGroupId,
    tjm_free: tjm,
    dispo_from: dispo,
    disponible: new Date(dispo) <= new Date(),
    fluent_english: form.get('anglais') === 'on',
    cdi: form.get('cdi') === 'on',
    show_on_website: form.get('pas_visible') !== 'on',
    portfolio_url: get('portfolio') || null,
    portfolio_pdf_url: portfolioPath,
    cv_url: cvPath,
    photo_url: photoUrl,
    reference_html: referenceHtml,
    preferences_html: notes ? `<p>${esc(notes)}</p>` : null,
    notes_html: `<p>Inscription via le site le ${new Date().toLocaleDateString('fr-FR')}</p>`,
  };

  const ins = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!ins.ok) return json(500, { ok: false, error: "L'enregistrement a échoué — réessayez ou écrivez-nous." });

  return json(200, { ok: true });
};
