// Reference exchange rates for the CAD and USD amounts beside the rupee figures.
//   node scripts/fetch-fx.ts
// Reads the Bank of Canada's daily rates (Valet API, free to reuse with attribution) and
// writes data/fx.json. On failure it keeps the last good file and exits 0, so a build
// never stops for a rate.

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'data', 'fx.json');
const URL = 'https://www.bankofcanada.ca/valet/observations/FXINRCAD,FXUSDCAD/json?recent=10';
const UA = 'india-compliance-calendar/0.1 (+https://github.com/dgomesbr/india-compliance-calendar; exchange rates)';

interface Observation {
  d: string;
  FXINRCAD?: { v: string };
  FXUSDCAD?: { v: string };
}

try {
  const r = await fetch(URL, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const body = (await r.json()) as { observations?: Observation[] };
  // The latest business day that carries both series.
  const latest = (body.observations ?? []).filter((o) => o.FXINRCAD?.v && o.FXUSDCAD?.v).sort((a, b) => b.d.localeCompare(a.d))[0];
  if (!latest) throw new Error('no observation with both rates');
  const cadPerInr = Number(latest.FXINRCAD!.v);
  const usdcad = Number(latest.FXUSDCAD!.v);
  if (!(cadPerInr > 0 && usdcad > 0)) throw new Error('rates are not positive numbers');
  const fx = {
    source: 'Bank of Canada daily exchange rates',
    url: 'https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/',
    date: latest.d,
    cadPerInr,
    usdcad,
    usdPerInr: Number((cadPerInr / usdcad).toPrecision(6)),
    fetched: new Date().toISOString(),
  };
  writeFileSync(OUT, `${JSON.stringify(fx, null, 1)}\n`);
  console.log(`Rates for ${fx.date}: 1 CAD = ${(1 / cadPerInr).toFixed(2)} INR, 1 USD = ${(1 / fx.usdPerInr).toFixed(2)} INR`);
} catch (e) {
  console.log(`Exchange rates not updated (${e instanceof Error ? e.message : String(e)}); ${existsSync(OUT) ? 'keeping the last rates' : 'no rates yet'}.`);
}
