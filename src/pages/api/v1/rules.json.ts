import type { APIRoute } from 'astro';
import { getBundle } from '../../../lib/site-data.ts';

export const GET: APIRoute = () => {
  const { meta, rules } = getBundle();
  return new Response(JSON.stringify({ meta, rules }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
