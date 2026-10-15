// Checks every cited URL and prints a Markdown report (for the job summary).
//   node scripts/check-links.ts
// The every-other-day source refresher (scripts/refresh-sources.ts) runs the same check and records it.

import { checkLinks, citedUrls, linkReport } from './lib/links.ts';

const urls = citedUrls();
console.log(linkReport(urls.size, await checkLinks(urls)));
