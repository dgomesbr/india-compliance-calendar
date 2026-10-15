import type { APIRoute, GetStaticPaths } from 'astro';
import { feedFor } from '../../lib/feeds.ts';
import { getBundle } from '../../lib/site-data.ts';
import { AUDIENCES, AUDIENCE_LABEL, CATEGORIES, CATEGORY_LABEL, type Audience, type Category } from '../../lib/types.ts';

export const getStaticPaths: GetStaticPaths = () => [
  { params: { feed: 'all' } },
  ...CATEGORIES.map((c) => ({ params: { feed: c } })),
  ...AUDIENCES.map((a) => ({ params: { feed: `for-${a}` } })),
];

export const GET: APIRoute = ({ params }) => {
  const feed = String(params.feed);
  const rules = getBundle().rules.filter((r) => r.schedule);
  let name = 'India Compliance Calendar';
  let list = rules;
  if ((CATEGORIES as readonly string[]).includes(feed)) {
    const c = feed as Category;
    name = `${CATEGORY_LABEL[c]} - India Compliance Calendar`;
    list = rules.filter((r) => r.category === c);
  } else if (feed.startsWith('for-')) {
    const a = feed.slice(4) as Audience;
    if ((AUDIENCES as readonly string[]).includes(a)) {
      name = `${AUDIENCE_LABEL[a]} - India Compliance Calendar`;
      list = rules.filter((r) => r.audience.includes(a));
    }
  }
  // The everything feed covers 12 months to stay light for calendar clients; the narrower feeds cover 24.
  const months = feed === 'all' ? 12 : 24;
  const body = feedFor(name, 'Indian statutory due dates with sources. Information only, not legal advice.', list, months);
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
