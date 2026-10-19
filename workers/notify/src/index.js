// Relais de notification email pour digitags.work.
// Reçoit un POST JSON { subject, html, replyTo } authentifié par secret
// partagé, et envoie l'email à hugo@digitags.work via le binding send_email.
import { EmailMessage } from 'cloudflare:email';

const FROM = 'contact@digitags.work';
const TO = 'hugo@digitags.work';

// Encodage RFC 2047 pour les en-têtes contenant des accents.
const encodeHeader = (s) =>
  /^[\x20-\x7e]*$/.test(s) ? s : `=?utf-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(s)))}?=`;

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  // Lignes de 76 caractères max (RFC 2045).
  return btoa(bin).replace(/(.{76})/g, '$1\r\n');
};

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const auth = request.headers.get('Authorization') ?? '';
    if (auth !== `Bearer ${env.NOTIFY_SECRET}`) return new Response('Unauthorized', { status: 401 });

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }
    const subject = String(payload.subject ?? 'Notification digitags.work').slice(0, 300);
    const html = String(payload.html ?? '');
    const replyTo = String(payload.replyTo ?? '').trim();
    if (!html) return new Response('Bad Request', { status: 400 });

    const raw =
      `From: digitags.work <${FROM}>\r\n` +
      `To: ${TO}\r\n` +
      (replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) ? `Reply-To: ${replyTo}\r\n` : '') +
      `Subject: ${encodeHeader(subject)}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n` +
      `Content-Transfer-Encoding: base64\r\n` +
      `\r\n` +
      b64(html);

    try {
      await env.NOTIFY.send(new EmailMessage(FROM, TO, raw));
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 502 });
    }
  },
};
