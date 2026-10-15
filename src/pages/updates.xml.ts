import type { APIRoute } from 'astro';
import { getUpdates, SITE_URL } from '../lib/site-data.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 of the collected regulator updates. */
export const GET: APIRoute = () => {
  const { items, fetched } = getUpdates();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>India Compliance Calendar - regulator updates</title>
<link>${SITE_URL}updates/</link>
<description>Circulars, notifications and press releases collected daily from Indian regulators.</description>
<language>en-in</language>
${fetched ? `<lastBuildDate>${new Date(fetched).toUTCString()}</lastBuildDate>` : ''}
${items
  .slice(0, 100)
  .map(
    (u) => `<item>
<title>${esc(u.title)}</title>
<link>${esc(u.url)}</link>
<guid isPermaLink="false">${esc(u.id)}</guid>
<pubDate>${new Date(`${u.date}T00:00:00+05:30`).toUTCString()}</pubDate>
<category>${esc(u.sourceName)}</category>
</item>`,
  )
  .join('\n')}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
