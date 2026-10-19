// Réception du formulaire de contact : enregistre la soumission dans
// contact_submissions, téléverse l'éventuel brief joint (bucket privé) et
// notifie hugo@digitags.work par email via le Worker digitags-notify
// (Cloudflare Email Workers — aucun service tiers).
export const prerender = false;

import type { APIRoute } from 'astro';

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
  const env = (locals as any)?.runtime?.env ?? {};
  const url = env.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY ?? import.meta.env.SUPABASE_SERVICE_KEY;
  const notifySecret = env.NOTIFY_SECRET ?? import.meta.env.NOTIFY_SECRET;
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
  if (form.get('bot-field')) return json(200, { ok: true });

  // Vérification reCAPTCHA v2 (si le secret est configuré).
  const captchaSecret = env.RECAPTCHA_SECRET ?? import.meta.env.RECAPTCHA_SECRET;
  if (captchaSecret) {
    const captcha = String(form.get('g-recaptcha-response') ?? '').trim();
    if (!captcha) return json(400, { ok: false, error: 'Merci de cocher « Je ne suis pas un robot ».' });
    const verif = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(captcha)}`,
    }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!verif.success) return json(400, { ok: false, error: 'Vérification anti-robot échouée — rechargez la page et réessayez.' });
  }

  const get = (k: string) => String(form.get(k) ?? '').trim();
  const nom = get('nom');
  const email = get('email');
  const societe = get('societe');
  const expertise = get('expertise');
  const message = get('message');

  if (!nom || !email || !message) {
    return json(400, { ok: false, error: 'Merci de remplir les champs obligatoires.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { ok: false, error: 'Adresse email invalide.' });
  }

  // Brief joint (optionnel) → bucket privé + lien signé 7 jours.
  let briefNote = '';
  let briefLink: string | null = null;
  const brief = form.get('brief') as File | null;
  if (brief && brief.size > 0) {
    if (brief.size > MAX_SIZE) return json(400, { ok: false, error: 'Le fichier joint dépasse 10 Mo.' });
    if (!BRIEF_TYPES.includes(brief.type)) return json(400, { ok: false, error: 'Format de fichier non accepté (PDF, Word, PowerPoint, JPG ou PNG).' });
    const safeName = (brief.name || 'brief').replace(/[^\w.\-]+/g, '_').slice(0, 80);
    const path = `briefs/${crypto.randomUUID()}/${safeName}`;
    const up = await fetch(`${url}/storage/v1/object/docs-internes/${path}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': brief.type },
      body: await brief.arrayBuffer(),
    });
    if (!up.ok) return json(500, { ok: false, error: "L'envoi du fichier a échoué — réessayez sans pièce jointe." });
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
  if (!ins.ok) return json(500, { ok: false, error: "L'envoi a échoué — réessayez, ou écrivez-nous à hello@digitags.work." });

  // Notification email (best effort : la soumission est déjà en base).
  if (notifySecret) {
    try {
      await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${notifySecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyTo: email,
          subject: `Nouveau brief — ${nom}${societe ? ` (${societe})` : ''}`,
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
