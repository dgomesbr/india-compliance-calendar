import type { APIRoute } from 'astro';
import { getBundle, publishedWindow, SITE_URL } from '../../../lib/site-data.ts';

export const GET: APIRoute = () => {
  const { meta } = getBundle();
  const endpoints = ['bundle', 'rules', 'occurrences', 'holidays', 'events', 'updates', 'sources', 'meta'].map(
    (n) => `${SITE_URL}api/v1/${n}.json`,
  );
  return new Response(JSON.stringify({ ...meta, window: publishedWindow(), endpoints }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
