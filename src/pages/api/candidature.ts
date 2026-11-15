// Réception des inscriptions freelance (formulaire /devenir-freelance).
// Valide, téléverse les fichiers (CV/portfolio → bucket privé, photo → bucket public),
// crée la fiche dans la table profiles et notifie l'équipe par email via le
// Worker digitags-notify. Exécuté côté serveur (clé service).
export const prerender = false;

import type { APIRoute } from 'astro';
import { emailBienvenue } from '../../lib/email-bienvenue';
import { emailWelcomeEn } from '../../lib/email-welcome-en';
import { serverEnv, checkFile, MAX, hasAngle, isEmail, isHttpUrl } from '../../lib/form-guards';

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const NOTIFY_URL = 'https://digitags-notify.mjharpon-pro.workers.dev';
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const IMG_TYPES = ['image/jpeg', 'image/png'];

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export const POST: APIRoute = async ({ request, locals }) => {
  const env = serverEnv(locals);
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  const notifySecret = env.NOTIFY_SECRET;
  const resendKey = env.RESEND_API_KEY;
  const json = (status: number, body: object) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (!url || !key) return json(500, { ok: false, error: 'Service momentanément indisponible.' });
  const H = { apikey: key, Authorization: `Bearer ${key}` };

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'Formulaire invalide.' });
  }

  // Piège anti-robots : champ caché qui doit rester vide.
  if (form.get('website')) return json(200, { ok: true });

  // Les sauts de ligne arrivent en CRLF : ramenés à LF pour que les longueurs
  // comptées ici soient celles du `maxlength` du formulaire.
  const get = (k: string) => String(form.get(k) ?? '').replace(/\r\n?/g, '\n').trim();
  // Formulaire anglais (/en/become-a-freelancer) : champ caché lang=en.
  const en = get('lang') === 'en';
  const msg = (fr: string, enMsg: string) => (en ? enMsg : fr);
  const prenom = get('prenom');
  const nom = get('nom');
  const email = get('email');
  const tjm = Number(get('tjm'));
  const dispo = get('dispo');
  const specialite = get('specialite');
  const job = get('job');

  if (!prenom || !nom || !email || !tjm || !dispo || !specialite || !job) {
    return json(400, { ok: false, error: msg('Merci de remplir tous les champs obligatoires.', 'Please fill in all the required fields.') });
  }
  if (!isEmail(email)) {
    return json(400, { ok: false, error: msg('Adresse email invalide.', 'Invalid email address.') });
  }

  // Bornes côté serveur : longueurs maximales, pas de chevrons dans l'identité,
  // TJM et date plausibles, lien de portfolio en http(s) uniquement.
  const references = get('references');
  const notes = get('notes');
  const portfolio = get('portfolio');
  if (hasAngle(prenom) || hasAngle(nom) || hasAngle(job)) {
    return json(400, { ok: false, error: msg('Les caractères < et > ne sont pas acceptés dans le prénom, le nom et le métier.', 'The characters < and > are not accepted in the first name, last name and job title.') });
  }
  if (
    prenom.length > MAX.prenom || nom.length > MAX.nom || job.length > MAX.job
    || specialite.length > MAX.choix || references.length > MAX.references || notes.length > MAX.texte
  ) {
    return json(400, { ok: false, error: msg('Un des champs est trop long — merci de le raccourcir.', 'One of the fields is too long — please shorten it.') });
  }
  if (!Number.isFinite(tjm) || tjm <= 0 || tjm > 100000) {
    return json(400, { ok: false, error: msg('TJM invalide.', 'Invalid day rate.') });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dispo) || Number.isNaN(new Date(dispo).getTime())) {
    return json(400, { ok: false, error: msg('Date de disponibilité invalide.', 'Invalid availability date.') });
  }
  if (portfolio && !isHttpUrl(portfolio)) {
    return json(400, { ok: false, error: msg('Le lien du portfolio doit commencer par https:// (ou http://).', 'The portfolio link must start with https:// (or http://).') });
  }

  const cv = form.get('cv') as File | null;
  if (!cv || cv.size === 0) return json(400, { ok: false, error: msg('Le CV est obligatoire.', 'The CV/resume is required.') });

  const files: { field: string; file: File; types: string[] }[] = [
    { field: 'cv', file: cv, types: DOC_TYPES },
  ];
  const photo = form.get('photo') as File | null;
  if (photo && photo.size > 0) files.push({ field: 'photo', file: photo, types: IMG_TYPES });
  const portfolioPdf = form.get('portfolio_pdf') as File | null;
  if (portfolioPdf && portfolioPdf.size > 0) files.push({ field: 'portfolio_pdf', file: portfolioPdf, types: DOC_TYPES });

  // Taille, type déclaré ET signature du contenu (octets magiques).
  for (const f of files) {
    const problem = await checkFile(f.file, f.types, MAX_SIZE);
    if (problem === 'size') return json(400, { ok: false, error: msg(`Fichier « ${f.field} » trop lourd (10 Mo max).`, `File "${f.field}" is too large (10 MB max).`) });
    if (problem === 'empty') return json(400, { ok: false, error: msg(`Fichier « ${f.field} » vide ou illisible.`, `File "${f.field}" is empty or unreadable.`) });
    if (problem === 'type') return json(400, { ok: false, error: msg(`Format non accepté pour « ${f.field} ».`, `Unsupported format for "${f.field}".`) });
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
    return json(500, { ok: false, error: msg("L'envoi des fichiers a échoué — réessayez ou écrivez-nous.", 'The file upload failed — please try again or email us.') });
  }

  // Références clients → HTML simple.
  const referenceHtml = references
    ? references.split(/[,;\n]/).map((r) => r.trim()).filter(Boolean).map((r) => `<p>${esc(r)}</p>`).join('')
    : null;

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
    portfolio_url: portfolio || null,
    portfolio_pdf_url: portfolioPath,
    cv_url: cvPath,
    photo_url: photoUrl,
    reference_html: referenceHtml,
    preferences_html: notes ? `<p>${esc(notes)}</p>` : null,
    notes_html: `<p>Inscription via le site le ${new Date().toLocaleDateString('fr-FR')}${en ? ' (formulaire EN)' : ''}</p>`,
  };

  const ins = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!ins.ok) return json(500, { ok: false, error: msg("L'enregistrement a échoué — réessayez ou écrivez-nous.", 'Saving your profile failed — please try again or email us.') });

  // Notification email à l'équipe (best effort : la fiche est déjà en base).
  if (notifySecret) {
    try {
      // Lien de téléchargement du CV valable 7 jours.
      let cvLink: string | null = null;
      if (cvPath) {
        const objectPath = cvPath.replace(/^docs-internes\//, '');
        const sign = await fetch(`${url}/storage/v1/object/sign/docs-internes/${objectPath}`, {
          method: 'POST',
          headers: { ...H, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: 604800 }),
        });
        if (sign.ok) cvLink = `${url}/storage/v1${(await sign.json()).signedURL}`;
      }
      await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${notifySecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyTo: email,
          subject: `Nouvelle inscription freelance — ${prenom} ${nom} (${job})${en ? ' (formulaire EN)' : ''}`,
          html: `
            <h2 style="font-family:sans-serif;">Nouveau freelance inscrit via digitags.work</h2>
            <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Nom</td><td>${esc(prenom)} ${esc(nom)}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Métier</td><td>${esc(job)}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Spécialité</td><td>${esc(specialite)}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">TJM</td><td>${tjm} € (hors commission)</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Disponible</td><td>à partir du ${esc(dispo)}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Anglais courant</td><td>${form.get('anglais') === 'on' ? 'Oui' : 'Non'}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Ouvert CDI</td><td>${form.get('cdi') === 'on' ? 'Oui' : 'Non'}</td></tr>
              ${references ? `<tr><td style="padding:4px 14px 4px 0;color:#777;">Références</td><td>${esc(references)}</td></tr>` : ''}
              ${portfolio ? `<tr><td style="padding:4px 14px 4px 0;color:#777;">Portfolio</td><td><a href="${esc(portfolio)}">${esc(portfolio)}</a></td></tr>` : ''}
            </table>
            ${notes ? `<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;border-left:3px solid #2b46f0;padding-left:12px;">${esc(notes)}</p>` : ''}
            ${cvLink ? `<p style="font-family:sans-serif;font-size:14px;"><a href="${esc(cvLink)}">📎 Télécharger le CV</a> (lien valable 7 jours)</p>` : ''}
            <p style="font-family:sans-serif;font-size:12.5px;color:#777;">La fiche complète est dans l'outil Talents (profil « ${esc(prenom)} ${esc(nom)} », inscrit aujourd'hui).</p>
          `,
        }),
      });
    } catch { /* la notification ne doit jamais faire échouer l'inscription */ }
  }

  // Email de bienvenue au freelance (best effort, via Resend).
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'digitags.work <talents@digitags.work>',
          to: [email],
          reply_to: 'hello@digitags.work',
          // Sujet fixe : aucune donnée saisie par l'internaute dans l'en-tête du mail.
          subject: en ? 'Welcome to the digitags.work Hub 👋' : 'Bienvenue dans le Hub digitags.work 👋',
          html: en ? emailWelcomeEn(prenom, job) : emailBienvenue(prenom, job),
        }),
      });
    } catch { /* l'inscription n'échoue jamais à cause de l'email de bienvenue */ }
  }

  return json(200, { ok: true });
};
