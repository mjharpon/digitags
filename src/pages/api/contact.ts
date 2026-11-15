// Réception du formulaire de contact : enregistre la soumission dans
// contact_submissions, téléverse l'éventuel brief joint (bucket privé) et
// notifie hugo@digitags.work par email via le Worker digitags-notify
// (Cloudflare Email Workers — aucun service tiers).
export const prerender = false;

import type { APIRoute } from 'astro';
import { serverEnv, checkFile, MAX, hasAngle, isEmail } from '../../lib/form-guards';

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const BRIEF_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
];
const NOTIFY_URL = 'https://digitags-notify.mjharpon-pro.workers.dev';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export const POST: APIRoute = async ({ request, locals }) => {
  const env = serverEnv(locals);
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  const notifySecret = env.NOTIFY_SECRET;
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
  if (form.get('site_web')) return json(200, { ok: true });

  // Les sauts de ligne arrivent en CRLF : ramenés à LF pour que les longueurs
  // comptées ici soient celles du `maxlength` du formulaire.
  const get = (k: string) => String(form.get(k) ?? '').replace(/\r\n?/g, '\n').trim();
  // Formulaire anglais (/en/contact) : champ caché lang=en.
  const en = get('lang') === 'en';
  const msg = (fr: string, enMsg: string) => (en ? enMsg : fr);
  const nom = get('nom');
  const email = get('email');
  const societe = get('societe');
  const expertise = get('expertise');
  const message = get('message');

  if (!nom || !email || !message) {
    return json(400, { ok: false, error: msg('Merci de remplir les champs obligatoires.', 'Please fill in the required fields.') });
  }
  if (!isEmail(email)) {
    return json(400, { ok: false, error: msg('Adresse email invalide.', 'Invalid email address.') });
  }
  // Bornes côté serveur : longueurs maximales, pas de chevrons dans le nom.
  if (hasAngle(nom)) {
    return json(400, { ok: false, error: msg('Les caractères < et > ne sont pas acceptés dans le nom.', 'The characters < and > are not accepted in the name.') });
  }
  if (nom.length > MAX.nom || societe.length > MAX.societe || expertise.length > MAX.choix || message.length > MAX.texte) {
    return json(400, { ok: false, error: msg('Un des champs est trop long — merci de le raccourcir (message : 5 000 caractères max).', 'One of the fields is too long — please shorten it (message: 5,000 characters max).') });
  }

  // Brief joint (optionnel) → bucket privé + lien signé 7 jours.
  let briefNote = '';
  let briefLink: string | null = null;
  const brief = form.get('brief') as File | null;
  if (brief && brief.size > 0) {
    // Taille, type déclaré ET signature du contenu (octets magiques).
    const problem = await checkFile(brief, BRIEF_TYPES, MAX_SIZE);
    if (problem === 'size') return json(400, { ok: false, error: msg('Le fichier joint dépasse 10 Mo.', 'The attached file exceeds 10 MB.') });
    if (problem === 'empty') return json(400, { ok: false, error: msg('Le fichier joint est vide ou illisible.', 'The attached file is empty or unreadable.') });
    if (problem === 'type') return json(400, { ok: false, error: msg('Format de fichier non accepté (PDF, Word, PowerPoint, JPG ou PNG).', 'Unsupported file format (PDF, Word, PowerPoint, JPG or PNG).') });
    const safeName = (brief.name || 'brief').replace(/[^\w.\-]+/g, '_').slice(0, 80);
    const path = `briefs/${crypto.randomUUID()}/${safeName}`;
    const up = await fetch(`${url}/storage/v1/object/docs-internes/${path}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': brief.type },
      body: await brief.arrayBuffer(),
    });
    if (!up.ok) return json(500, { ok: false, error: msg("L'envoi du fichier a échoué — réessayez sans pièce jointe.", 'The file upload failed — please try again without the attachment.') });
    const sign = await fetch(`${url}/storage/v1/object/sign/docs-internes/${path}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 604800 }), // 7 jours
    });
    if (sign.ok) {
      const { signedURL } = await sign.json();
      briefLink = `${url}/storage/v1${signedURL}`;
    }
    briefNote = `\n\n[Brief joint] docs-internes/${path}`;
  }

  const ins = await fetch(`${url}/rest/v1/contact_submissions`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      profil: 'entreprise',
      nom,
      email,
      societe: societe || null,
      expertise: expertise || null,
      message: message + briefNote,
    }),
  });
  if (!ins.ok) return json(500, { ok: false, error: msg("L'envoi a échoué — réessayez, ou écrivez-nous à hello@digitags.work.", 'Sending failed — please try again, or email us at hello@digitags.work.') });

  // Notification email (best effort : la soumission est déjà en base).
  if (notifySecret) {
    try {
      await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${notifySecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyTo: email,
          subject: `Nouveau brief — ${nom}${societe ? ` (${societe})` : ''}${en ? ' (formulaire EN)' : ''}`,
          html: `
            <h2 style="font-family:sans-serif;">Nouvelle demande via digitags.work</h2>
            <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Nom</td><td>${esc(nom)}</td></tr>
              <tr><td style="padding:4px 14px 4px 0;color:#777;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
              ${societe ? `<tr><td style="padding:4px 14px 4px 0;color:#777;">Société</td><td>${esc(societe)}</td></tr>` : ''}
              ${expertise ? `<tr><td style="padding:4px 14px 4px 0;color:#777;">Expertise</td><td>${esc(expertise)}</td></tr>` : ''}
            </table>
            <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;border-left:3px solid #2b46f0;padding-left:12px;">${esc(message)}</p>
            ${briefLink ? `<p style="font-family:sans-serif;font-size:14px;"><a href="${esc(briefLink)}">📎 Télécharger le brief joint</a> (lien valable 7 jours)</p>` : ''}
          `,
        }),
      });
    } catch { /* la notification ne doit jamais faire échouer la soumission */ }
  }

  return json(200, { ok: true });
};
