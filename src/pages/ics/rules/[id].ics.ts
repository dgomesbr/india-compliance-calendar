import type { APIRoute, GetStaticPaths } from 'astro';
import { feedFor } from '../../../lib/feeds.ts';
import { getBundle } from '../../../lib/site-data.ts';

export const getStaticPaths: GetStaticPaths = () =>
  getBundle()
    .rules.filter((r) => r.schedule)
    .map((r) => ({ params: { id: r.id } }));

export const GET: APIRoute = ({ params }) => {
  const rule = getBundle().rules.find((r) => r.id === params.id)!;
  const body = feedFor(`${rule.code} - India Compliance Calendar`, rule.title, [rule]);
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
