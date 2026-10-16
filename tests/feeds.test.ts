import { describe, expect, it } from 'vitest';
import { decode, parseFeed } from '../scripts/fetch-feeds.ts';

const feed = { id: 'test', name: 'Test regulator', url: 'https://example.gov.in/feed' };

describe('feed parsing', () => {
  it('reads RSS 2.0 with CDATA and entities', () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>
      <item><title><![CDATA[Master Circular &amp; FAQ – “KYC”]]></title><link>https://example.gov.in/a</link><pubDate>Tue, 13 Oct 2026 18:45:00 GMT</pubDate></item>
      <item><title>No link</title></item>
    </channel></rss>`;
    const items = parseFeed(xml, feed);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Master Circular & FAQ - "KYC"');
    expect(items[0].url).toBe('https://example.gov.in/a');
    // 18:45 GMT is past midnight in IST.
    expect(items[0].date).toBe('2026-10-14');
  });

  it('reads Atom entries with alternate links', () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Notification 12/2026</title>
      <link rel="alternate" href="https://example.gov.in/n12"/><updated>2026-10-01T10:00:00+05:30</updated></entry></feed>`;
    const [item] = parseFeed(xml, feed);
    expect(item.url).toBe('https://example.gov.in/n12');
    expect(item.date).toBe('2026-10-01');
  });

  it('filters by an include pattern', () => {
    const xml = `<rss><channel><item><title>Circular on LODR</title><link>https://x.gov.in/1</link></item><item><title>Tender notice</title><link>https://x.gov.in/2</link></item></channel></rss>`;
    expect(parseFeed(xml, { ...feed, include: 'circular' }).map((i) => i.url)).toEqual(['https://x.gov.in/1']);
  });

  it('decodes numeric entities and strips tags', () => {
    expect(decode('<b>A&#39;s</b> &#x26; B&nbsp;C')).toBe("A's & B C");
  });
});
