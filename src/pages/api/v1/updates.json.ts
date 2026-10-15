import type { APIRoute } from 'astro';
import { getUpdates } from '../../../lib/site-data.ts';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(getUpdates()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
