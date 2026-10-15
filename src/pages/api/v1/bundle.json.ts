import type { APIRoute } from 'astro';
import { getBundle } from '../../../lib/site-data.ts';

/** Everything the islands need: rules, holidays, planner events and metadata. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(getBundle()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
