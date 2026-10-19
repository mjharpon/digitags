// Endpoint de santé (relation « status » du catalogue d'API, RFC 9727).
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok', service: 'digitags.work' }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
