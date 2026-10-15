import type { APIRoute } from 'astro';
import { getBundle, occurrencesBetween, publishedWindow } from '../../../lib/site-data.ts';

/** Every dated occurrence from the start of the current FY to 25 months ahead. */
export const GET: APIRoute = () => {
  const { meta } = getBundle();
  const window = publishedWindow();
  const items = occurrencesBetween(window.from, window.to);
  return new Response(JSON.stringify({ meta, window, count: items.length, items }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
