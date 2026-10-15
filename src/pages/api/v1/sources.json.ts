import type { APIRoute } from 'astro';
import { getSources } from '../../../lib/site-data.ts';

/** The catalogue of open datasets and official sources behind the calendar. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ sources: getSources() }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
