import { useMemo, useRef, useState } from 'preact/hooks';
import { downloadFile, useBundle, useMoney, useTeamState, useToday } from '../lib/client.ts';
import { addMonths, formatDate, iso, parts, type ISODate } from '../lib/dates.ts';
import { toExcelCSV, toTSV } from '../lib/csv.ts';
import { entityQuarter, entityStartYear, entityYear, INDIAN_FY_START } from '../lib/fiscal.ts';
import { MAX_CUSTOM_MONTHS, minHorizonStart } from '../lib/horizon.ts';
import { toRef } from '../lib/money.ts';
import { isEverything } from '../lib/profile.ts';
import { CATEGORY_LABEL } from '../lib/types.ts';
import { useCountUp, useThumb } from '../lib/motion.ts';
import { buildRows, doneWord, sortRows, type Row } from '../lib/view.ts';
import { Icon } from './Icon.tsx';

type PeriodKey = 'this-q' | 'last-q' | 'this-fy' | 'last-fy' | 'custom';

type ReportStatus = 'Filed' | 'Overdue' | 'Pending' | 'Not recorded';

function Count({ value }: { value: number }) {
  return <>{Math.round(useCountUp(value))}</>;
}

function statusOf(r: Row, today: ISODate, trackingSince: ISODate): ReportStatus {
  if (r.filed) return 'Filed';
  if (r.occ.due >= today) return 'Pending';
  return r.occ.due >= trackingSince ? 'Overdue' : 'Not recorded';
}

export default function Report() {
  const data = useBundle();
  const [team] = useTeamState();
  const today = useToday();
  const [period, setPeriod] = useState<PeriodKey>('this-q');
  const [custom, setCustom] = useState({ from: iso(parts(today).y, parts(today).m, 1), to: addMonths(today, 1) });
  const segRef = useRef<HTMLDivElement>(null);
  const thumb = useThumb(segRef, '.seg-btn.is-on', [period, data.status, Boolean(team)]);
  const money = useMoney(data.status === 'ready' ? data.data : null, team);
  const [copied, setCopied] = useState('');

  // Quarters and years are the entity's own: April to March unless the profile sets another year.
  const fyStart = team?.profile.fyStart ?? INDIAN_FY_START;
  const minFrom = minHorizonStart(today);
  const maxTo = addMonths(today, MAX_CUSTOM_MONTHS);
  const range = useMemo(() => {
    const fy = entityStartYear(today, fyStart);
    switch (period) {
      case 'this-q':
        return entityQuarter(today, 0, fyStart);
      case 'last-q':
        return entityQuarter(today, -1, fyStart);
      case 'this-fy':
      case 'last-fy': {
        const y = entityYear(period === 'this-fy' ? fy : fy - 1, fyStart);
        return { from: y.from, to: y.to, label: y.label };
      }
      case 'custom': {
        const from = custom.from < minFrom ? minFrom : custom.from;
        const to = custom.to < from ? from : custom.to > maxTo ? maxTo : custom.to;
        return { from, to, label: `${formatDate(from, { weekday: false })} - ${formatDate(to, { weekday: false })}` };
      }
    }
  }, [period, today, custom, fyStart]);

  const rows = useMemo(() => {
    if (data.status !== 'ready' || !team) return [] as Row[];
    return sortRows(
      buildRows({
        bundle: data.data,
        profile: team.profile,
        today,
        from: range.from,
        to: range.to,
        filed: team.filed,
        planned: team.planned,
        trackingSince: range.from,
        includeOverdue: true,
      }).filter((r) => r.occ.due >= range.from && r.occ.due <= range.to),
      'due',
    );
  }, [data, team, today, range]);

  if (data.status === 'error') return <p class="page" role="alert">{data.message}</p>;
  if (data.status === 'loading' || !team) return <div class="page"><div class="skeleton" style="height:320px;margin-top:32px" /></div>;

  const counts: Record<ReportStatus, number> = { Filed: 0, Overdue: 0, Pending: 0, 'Not recorded': 0 };
  for (const r of rows) counts[statusOf(r, today, team.trackingSince)]++;
  const entity = isEverything(team.profile) ? 'All obligations (no entity profile set)' : team.profile.name;

  // The same table for the CSV download and the clipboard: fixed costs in rupees, with the
  // reference currency at the rate shown in the last column.
  const ref = money.cur.toLowerCase();
  const header = [
    'due', 'code', 'obligation', 'period', 'law_area', 'authority', 'status', 'filed_on', 'acknowledgement', 'owner', 'extended_from',
    'cost_30_days_inr', ...(money.fx ? [`cost_30_days_${ref}`, `${ref}_rate_date`] : []), 'runs_from', 'source',
  ];
  const table = () =>
      rows.map((r) => [
        r.occ.due,
        r.rule.code,
        r.rule.title,
        r.occ.periodLabel,
        CATEGORY_LABEL[r.rule.category],
        r.rule.authority,
        statusOf(r, today, team.trackingSince) === 'Filed' ? doneWord(r.rule) : statusOf(r, today, team.trackingSince),
        r.filed?.filedOn ?? '',
        r.filed?.ack ?? '',
        r.filed?.owner ?? team.owners[r.rule.id] ?? '',
        r.occ.originalDue ?? '',
        r.exposure || '',
        ...(money.fx ? [r.exposure ? toRef(r.exposure, money.fx, money.cur).toFixed(2) : '', money.fx.date] : []),
        r.chainNote ?? '',
        r.rule.sources[0]?.url ?? '',
      ]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toTSV(header, table()));
      setCopied(`Copied ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} with headings. Paste into Excel or Sheets.`);
    } catch {
      setCopied('The browser blocked the clipboard. Use Download CSV instead.');
    }
    setTimeout(() => setCopied(''), 4000);
  };

  return (
    <div class="page report">
      <header class="report-head no-print">
        <div class="report-controls">
          <div class="seg" role="group" aria-label="Period" ref={segRef}>
            {thumb && (
              <span
                class="seg-thumb"
                aria-hidden="true"
                style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)`, width: `${thumb.w}px`, height: `${thumb.h}px` }}
              />
            )}
            {([
              ['this-q', 'This quarter'],
              ['last-q', 'Last quarter'],
              ['this-fy', 'This FY'],
              ['last-fy', 'Last FY'],
              ['custom', 'Custom'],
            ] as [PeriodKey, string][]).map(([k, l]) => (
              <button type="button" aria-pressed={period === k} class={`seg-btn${period === k ? ' is-on' : ''}`} onClick={() => setPeriod(k)}>
                {l}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div class="report-custom">
              <label class="label faint" for="r-from">From</label>
              <input id="r-from" class="input num" type="date" value={range.from} min={minFrom} max={maxTo}
                onChange={(e) => setCustom({ ...custom, from: (e.target as HTMLInputElement).value || minFrom })} />
              <label class="label faint" for="r-to">To</label>
              <input id="r-to" class="input num" type="date" value={range.to} min={range.from} max={maxTo}
                onChange={(e) => setCustom({ ...custom, to: (e.target as HTMLInputElement).value || range.from })} />
              <span class="faint">From up to 15 months back</span>
            </div>
          )}
          <div class="form-actions">
            <button class="btn" type="button" onClick={() => window.print()}><span class="btn-label"><Icon name="printer" />Print</span><span class="btn-block" /></button>
            <button class="btn" type="button" onClick={copy} disabled={!rows.length}>
              <span class="btn-label"><Icon name={copied.startsWith('Copied') ? 'check' : 'copy'} />Copy for Excel</span>
            </button>
            <button class="btn" type="button" disabled={!rows.length}
              onClick={() => downloadFile(`compliance-report-${range.from}-${range.to}.csv`, 'text/csv;charset=utf-8', toExcelCSV(header, table()))}>
              <span class="btn-label"><Icon name="download" />Download CSV</span>
            </button>
          </div>
          <p class="report-copied" role="status">{copied}</p>
        </div>
      </header>

      <article class="report-sheet">
        <header class="report-sheet-head">
          <h2 class="fig display report-period" key={range.label}>{range.label}</h2>
          <p>Statutory compliance status - {entity}</p>
          <p class="faint num">
            {formatDate(range.from)} to {formatDate(range.to)} - prepared {formatDate(today)}
          </p>
        </header>
        <dl class="report-summary num">
          <div><dt class="label faint">Obligations</dt><dd class="fig display"><Count value={rows.length} /></dd></div>
          <div><dt class="label faint">Filed</dt><dd class="fig display"><Count value={counts.Filed} /></dd></div>
          <div><dt class="label faint">Overdue</dt><dd class={`fig display${counts.Overdue ? ' state-overdue' : ''}`}><Count value={counts.Overdue} /></dd></div>
          <div><dt class="label faint">Pending</dt><dd class="fig display"><Count value={counts.Pending} /></dd></div>
          <div><dt class="label faint">Not recorded</dt><dd class="fig display"><Count value={counts['Not recorded']} /></dd></div>
        </dl>
        {rows.length === 0 ? (
          <p class="muted">No obligations for this profile in the period.</p>
        ) : (
          <table class="report-table">
            <thead>
              <tr>
                <th scope="col" class="label">Due</th>
                <th scope="col" class="label">Obligation</th>
                <th scope="col" class="label">Period</th>
                <th scope="col" class="label">Status</th>
                <th scope="col" class="label">Filed on</th>
                <th scope="col" class="label">Acknowledgement</th>
                <th scope="col" class="label">Owner</th>
              </tr>
            </thead>
            <tbody key={`${range.from}|${range.to}`}>
              {rows.map((r, i) => {
                const s = statusOf(r, today, team.trackingSince);
                return (
                  <tr class={`report-row rise status-${s.replace(' ', '-').toLowerCase()}`} style={{ '--i': Math.min(i, 14) }}>
                    <td class="num">{formatDate(r.occ.due, { weekday: false })}{r.occ.originalDue && <span class="faint"> (ext.)</span>}</td>
                    <td>
                      <span class="fig report-code">{r.rule.code}</span> {r.rule.title}
                      {r.chainNote && <span class="report-chain faint">{r.chainNote}</span>}
                    </td>
                    <td class="muted">{r.occ.periodLabel}</td>
                    <td>{s === 'Filed' ? doneWord(r.rule) : s}</td>
                    <td class="num">{r.filed ? formatDate(r.filed.filedOn, { weekday: false }) : ''}</td>
                    <td class="num">{r.filed?.ack ?? ''}</td>
                    <td>{r.filed?.owner ?? team.owners[r.rule.id] ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p class="report-foot faint">
          Due dates from India Compliance Calendar, compiled from official sources and verified on the dates shown in each
          entry. "Not recorded" means the due date passed before the team began recording filings. Information only, not legal advice.
        </p>
      </article>
    </div>
  );
}
