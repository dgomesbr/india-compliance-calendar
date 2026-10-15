import type { APIRoute } from 'astro';
import { getBundle, publishedWindow, SITE_URL } from '../lib/site-data.ts';
import { CATEGORIES, CATEGORY_LABEL } from '../lib/types.ts';

/** Orientation for AI agents (https://llmstxt.org). */
export const GET: APIRoute = () => {
  const { meta } = getBundle();
  const w = publishedWindow();
  const body = `# India Compliance Calendar

> Source-cited Indian statutory due dates (income tax, GST, MCA and LLP, SEBI LODR, RBI and FEMA, EPF, ESI and labour codes, state professional tax and labour welfare fund, foreign trade and other regulators), with structured penalty exposure, holidays and regulator updates. Information only, not legal advice.

Data is rebuilt daily. ${meta.counts.rules} rules. Dates up to ${meta.confirmedThrough} were checked against the cited sources; later dates are projected from the standing rule and flagged \`projected: true\`.

## Data

- [Bundle](${SITE_URL}api/v1/bundle.json): rules, holidays, planner events and metadata
- [Rules](${SITE_URL}api/v1/rules.json): obligations as recurring rules with schedule, applicability, law, exposure and sources
- [Occurrences](${SITE_URL}api/v1/occurrences.json): dated occurrences from ${w.from} to ${w.to}
- [Holidays](${SITE_URL}api/v1/holidays.json): central gazetted, restricted, bank and exchange holidays
- [Planner events](${SITE_URL}api/v1/events.json): deadlines that run from an event such as an AGM or allotment
- [Regulator updates](${SITE_URL}api/v1/updates.json): latest items from official feeds
- [Sources](${SITE_URL}api/v1/sources.json): catalogue of open datasets and official sources

## Conventions

- Dates are YYYY-MM-DD in India Standard Time. Financial year runs April to March.
- A rule's schedule places the due date relative to the end of its period: \`day\` of (period's last month + \`monthOffset\`), or \`daysAfter\` the period end. Periodic keys: "2026-08" (month), "FY2026-27-Q1", "FY2026-27-H1", "FY2025-26", "CY2026".
- \`overrides\` record officially notified extensions with their source; an occurrence moved by one carries \`originalDue\` and \`extended\`.
- \`exposure\` is structured: late fee per day, cap, fixed and maximum penalty, interest, percent of turnover, and other consequences. The site sorts by the fixed cost of a 30-day delay.
- Categories: ${CATEGORIES.map((c) => `${c} (${CATEGORY_LABEL[c]})`).join(', ')}.

## Agents

- MCP server: clone https://github.com/dgomesbr/india-compliance-calendar and run \`node mcp/server.ts\` (Node 22.18+). Tools: upcoming_obligations, get_obligation, search_obligations, event_deadlines, check_date, list_holidays, regulatory_updates.
- Calendar feeds: ${SITE_URL}ics/all.ics and one per category and audience, listed at ${SITE_URL}subscribe/

## Optional

- [Method and sources](${SITE_URL}sources/)
- [Repository](https://github.com/dgomesbr/india-compliance-calendar)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
