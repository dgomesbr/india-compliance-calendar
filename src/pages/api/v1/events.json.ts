import type { APIRoute } from 'astro';
import { getBundle } from '../../../lib/site-data.ts';

/** Event types for the trigger planner and their downstream deadlines. */
export const GET: APIRoute = () => {
  const { meta, events } = getBundle();
  return new Response(JSON.stringify({ meta, events }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
