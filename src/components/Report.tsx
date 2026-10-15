import { useMemo, useState } from 'preact/hooks';
import { downloadFile, useBundle, useTeamState, useToday } from '../lib/client.ts';
import { addMonths, formatDate, fyLabel, fyStartYear, iso, lastDayOfMonth, parts, shiftMonth, type ISODate } from '../lib/dates.ts';
import { toCSV } from '../lib/csv.ts';
import { isEverything } from '../lib/profile.ts';
import { CATEGORY_LABEL } from '../lib/types.ts';
import { buildRows, sortRows, type Row } from '../lib/view.ts';
import { Icon } from './Icon.tsx';

type PeriodKey = 'this-q' | 'last-q' | 'this-fy' | 'last-fy' | 'custom';

function quarterOf(date: ISODate, offset: number): { from: ISODate; to: ISODate; label: string } {
  const { y, m } = parts(date);
  // FY quarters start in April, July, October and January.
  const startMonth = m >= 4 ? 4 + Math.floor((m - 4) / 3) * 3 : 1;
  const s = shiftMonth(y, startMonth, offset * 3);
  const e = shiftMonth(s.y, s.m, 2);
  const fy = s.m >= 4 ? s.y : s.y - 1;
  const q = s.m >= 4 ? (s.m - 4) / 3 + 1 : 4;
  return { from: iso(s.y, s.m, 1), to: lastDayOfMonth(e.y, e.m), label: `Q${q} ${fyLabel(fy)}` };
}

type ReportStatus = 'Filed' | 'Overdue' | 'Pending' | 'Not recorded';

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

  const range = useMemo(() => {
    const fy = fyStartYear(today);
    switch (period) {
      case 'this-q':
        return quarterOf(today, 0);
      case 'last-q':
        return quarterOf(today, -1);
      case 'this-fy':
        return { from: iso(fy, 4, 1), to: iso(fy + 1, 3, 31), label: fyLabel(fy) };
      case 'last-fy':
        return { from: iso(fy - 1, 4, 1), to: iso(fy, 3, 31), label: fyLabel(fy - 1) };
      case 'custom':
        return { ...custom, label: `${formatDate(custom.from, { weekday: false })} - ${formatDate(custom.to, { weekday: false })}` };
    }
  }, [period, today, custom]);

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

  const csv = () =>
    toCSV(
      ['due', 'code', 'obligation', 'period', 'law_area', 'authority', 'status', 'filed_on', 'acknowledgement', 'owner', 'extended_from', 'source'],
      rows.map((r) => [
        r.occ.due,
        r.rule.code,
        r.rule.title,
        r.occ.periodLabel,
        CATEGORY_LABEL[r.rule.category],
        r.rule.authority,
        statusOf(r, today, team.trackingSince),
        r.filed?.filedOn ?? '',
        r.filed?.ack ?? '',
        r.filed?.owner ?? team.owners[r.rule.id] ?? '',
        r.occ.originalDue ?? '',
        r.rule.sources[0]?.url ?? '',
      ]),
    );

  return (
    <div class="page report">
      <header class="report-head no-print">
        <h1 class="fig report-title">Board report</h1>
        <p class="muted">
          Compliance status for a period, ready to print for the board or audit committee. Filing status comes from what the
          team recorded in this browser or imported from a teammate.
        </p>
        <div class="report-controls">
          <div class="seg" role="group" aria-label="Period">
            {([
              ['this-q', 'This quarter'],
              ['last-q', 'Last quarter'],
              ['this-fy', 'This FY'],
              ['last-fy', 'Last FY'],
              ['custom', 'Custom'],
            ] as [PeriodKey, string][]).map(([k, l]) => (
              <button type="button" aria-pressed={period === k} class={`seg-btn label${period === k ? ' is-on' : ''}`} onClick={() => setPeriod(k)}>
                {l}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div class="report-custom">
              <label class="label faint" for="r-from">From</label>
              <input id="r-from" class="input num" type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: (e.target as HTMLInputElement).value })} />
              <label class="label faint" for="r-to">To</label>
              <input id="r-to" class="input num" type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: (e.target as HTMLInputElement).value })} />
            </div>
          )}
          <div class="form-actions">
            <button class="btn" type="button" onClick={() => window.print()}><span class="btn-label"><Icon name="printer" />Print</span><span class="btn-block" /></button>
            <button class="btn" type="button" onClick={() => downloadFile(`compliance-report-${range.from}-${range.to}.csv`, 'text/csv', csv())}>
              <span class="btn-label"><Icon name="download" />CSV</span>
            </button>
          </div>
        </div>
      </header>

      <article class="report-sheet">
        <header class="report-sheet-head">
          <h2 class="fig report-period">{range.label}</h2>
          <p>Statutory compliance status - {entity}</p>
          <p class="faint num">
            {formatDate(range.from)} to {formatDate(range.to)} - prepared {formatDate(today)}
          </p>
        </header>
        <dl class="report-summary num">
          <div><dt class="label faint">Obligations</dt><dd class="fig">{rows.length}</dd></div>
          <div><dt class="label faint">Filed</dt><dd class="fig">{counts.Filed}</dd></div>
          <div><dt class="label faint">Overdue</dt><dd class={`fig${counts.Overdue ? ' state-overdue' : ''}`}>{counts.Overdue}</dd></div>
          <div><dt class="label faint">Pending</dt><dd class="fig">{counts.Pending}</dd></div>
          <div><dt class="label faint">Not recorded</dt><dd class="fig">{counts['Not recorded']}</dd></div>
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
            <tbody>
              {rows.map((r) => {
                const s = statusOf(r, today, team.trackingSince);
                return (
                  <tr class={`report-row status-${s.replace(' ', '-').toLowerCase()}`}>
                    <td class="num">{formatDate(r.occ.due, { weekday: false })}{r.occ.originalDue && <span class="faint"> (ext.)</span>}</td>
                    <td><span class="fig report-code">{r.rule.code}</span> {r.rule.title}</td>
                    <td class="muted">{r.occ.periodLabel}</td>
                    <td>{s}</td>
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
