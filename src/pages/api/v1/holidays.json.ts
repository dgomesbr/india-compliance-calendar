import type { APIRoute } from 'astro';
import { getBundle } from '../../../lib/site-data.ts';

export const GET: APIRoute = () => {
  const { meta, holidays } = getBundle();
  return new Response(JSON.stringify({ meta, lists: holidays }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
