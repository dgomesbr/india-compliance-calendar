import { useEffect, useMemo, useState } from 'preact/hooks';
import { baseUrl, downloadFile } from '../lib/client.ts';
import { addDays, addMonths, formatDate, relativeDays, todayIST, type ISODate } from '../lib/dates.ts';
import { hasDelayCurve } from '../lib/delay.ts';
import { delayCost, interestNote, turnoverNote } from '../lib/exposure.ts';
import { buildCalendar } from '../lib/ics.ts';
import { describeSchedule, expandRule } from '../lib/schedule.ts';
import type { TeamState } from '../lib/store.ts';
import { CATEGORY_LABEL, CATEGORY_SHORT, type Bundle } from '../lib/types.ts';
import { centralHolidays, STATE_LABEL, type Row } from '../lib/view.ts';
import DelayChart from './DelayChart.tsx';
import { Icon } from './Icon.tsx';
import { Money } from './Money.tsx';

export function Law({ row }: { row: Row }) {
  return <span class="law" data-law={row.rule.category}>{CATEGORY_SHORT[row.rule.category]}</span>;
}

interface Props {
  row: Row;
  today: ISODate;
  state: TeamState;
  /** Lets the panel list the obligation's next due dates. */
  bundle?: Bundle | null;
  onSave: (next: TeamState) => void;
  onClose: () => void;
  /** Prefix for element ids, so the side panel and the sheet can both be mounted. */
  idp?: string;
}

export function occurrenceICS(row: Row): string {
  const base = `${location.origin}${baseUrl()}`;
  return buildCalendar({
    name: `${row.rule.code} - ${row.occ.periodLabel}`,
    stamp: new Date(),
    events: [
      {
        uid: `${row.occ.key}@india-compliance-calendar`,
        date: row.occ.due,
        summary: `${row.rule.code} due - ${row.occ.periodLabel}`,
        description: `${row.rule.title}. ${row.rule.summary}\nLaw: ${row.rule.law}\nSource: ${row.rule.sources[0]?.url ?? ''}\nInformation only, not legal advice.`,
        url: `${base}o/${row.rule.id}/`,
        categories: [CATEGORY_LABEL[row.rule.category]],
        alarmsDaysBefore: [7, 1],
      },
    ],
  });
}

export default function Detail({ row, today, state, bundle, onSave, onClose, idp = 'd' }: Props) {
  const { rule, occ } = row;
  const filed = state.filed[occ.key];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ filedOn: todayIST(), ack: '', owner: state.owners[rule.id] ?? '', note: '' });
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditing(false);
    setForm({ filedOn: today, ack: '', owner: state.owners[rule.id] ?? '', note: '' });
    setDays(row.daysLeft < 0 ? Math.max(1, -row.daysLeft) : 30);
  }, [occ.key]);

  // The next few dates of the same obligation, so the panel answers "and after this?".
  const nextDates = useMemo(() => {
    if (!bundle || row.planned || !rule.schedule) return [];
    return expandRule(rule, addDays(occ.due, 1), addMonths(occ.due, 25), {
      confirmedThrough: bundle.meta.confirmedThrough,
      holidays: new Set(centralHolidays(bundle).keys()),
    }).slice(0, 3);
  }, [bundle, rule, occ.due, row.planned]);

  const owners = [...new Set([...Object.values(state.owners), ...Object.values(state.filed).map((f) => f.owner ?? '')])].filter(Boolean);
  const curve = hasDelayCurve(rule.exposure);
  const cost = delayCost(rule.exposure, 30);
  const interest = interestNote(rule.exposure);
  const turnover = turnoverNote(rule.exposure);
  const link = `${location.origin}${baseUrl()}o/${rule.id}/`;
  const id = (s: string) => `${idp}-${s}`;

  const save = (e: Event) => {
    e.preventDefault();
    const next: TeamState = {
      ...state,
      filed: { ...state.filed, [occ.key]: { filedOn: form.filedOn, ack: form.ack.trim() || undefined, owner: form.owner.trim() || undefined, note: form.note.trim() || undefined } },
      owners: form.owner.trim() ? { ...state.owners, [rule.id]: form.owner.trim() } : state.owners,
    };
    onSave(next);
    setEditing(false);
  };

  const undo = () => {
    const f = { ...state.filed };
    delete f[occ.key];
    onSave({ ...state, filed: f });
  };

  const setOwner = (owner: string) => {
    const o = { ...state.owners };
    if (owner.trim()) o[rule.id] = owner.trim();
    else delete o[rule.id];
    onSave({ ...state, owners: o });
  };

  return (
    <article class="detail" aria-labelledby={id('code')}>
      <header class="detail-head">
        <h2 id={id('code')} class="fig detail-code">{rule.code}</h2>
        <button class="btn btn-quiet detail-close" type="button" onClick={onClose} aria-label="Close details">
          <span class="btn-label"><Icon name="x" /></span>
        </button>
      </header>
      <p class="detail-title">{rule.title}</p>
      <p class="detail-meta">
        <span class="law" data-law={rule.category}>{CATEGORY_LABEL[rule.category]}</span>
        <span class="label">{rule.authority}</span>
        <span class="label">{occ.periodLabel}</span>
      </p>

      <dl class="detail-due">
        <div>
          <dt class="label faint">Due</dt>
          <dd class="num">{formatDate(occ.due, { weekday: false })}</dd>
        </div>
        <div>
          <dt class="label faint">When</dt>
          <dd class={`num state-${row.state}`}>{row.state === 'filed' ? 'Filed' : relativeDays(today, occ.due)}</dd>
        </div>
        <div>
          <dt class="label faint">State</dt>
          <dd><span class="tag" data-state={row.state === 'upcoming' ? undefined : row.state}>{STATE_LABEL[row.state]}</span></dd>
        </div>
      </dl>

      {nextDates.length > 0 && (
        <div class="detail-next">
          <span class="label">Then</span>
          <ol>
            {nextDates.map((o, i) => (
              <li style={{ '--i': i }}>
                <span class="num">{formatDate(o.due, { weekday: false })}</span>
                <span class="detail-next-period">{o.periodLabel}{o.extended ? ' - extended' : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {occ.extended && (
        <p class="detail-note extended">
          <span class="tag" data-state="extended">Extended</span> Moved from {formatDate(occ.originalDue ?? occ.due)}. {occ.extended.reason}
          {occ.extended.source && (
            <>
              {' '}
              <a href={occ.extended.source.url} rel="noopener" target="_blank">{occ.extended.source.title}</a>
            </>
          )}
        </p>
      )}
      {row.closed && row.state !== 'filed' && (
        <p class="detail-note">
          Falls on {row.closed.join(' and ')}. Online portals usually stay open, but banks and offices may not; plan to file a working day early.
        </p>
      )}
      {occ.projected && (
        <p class="detail-note">
          <span class="tag" data-state="projected">Projected</span> Computed from the standing rule. Confirm it again closer to the date.
        </p>
      )}
      {row.planned && (
        <p class="detail-note">Planned from {row.planned.eventTitle} on {formatDate(row.planned.eventDate)}.</p>
      )}

      <section class="detail-actions" aria-label="Filing">
        {filed ? (
          <div class="filed-card">
            <p>
              <span class="tag" data-state="filed">Filed</span>{' '}
              <span class="num">{formatDate(filed.filedOn)}</span>
              {filed.ack && <> - acknowledgement <span class="num">{filed.ack}</span></>}
              {filed.owner && <> - {filed.owner}</>}
            </p>
            {filed.note && <p class="muted">{filed.note}</p>}
            <button class="btn" type="button" onClick={undo}>
              <span class="btn-label">Undo filed</span>
            </button>
          </div>
        ) : editing ? (
          <form class="filed-form" onSubmit={save}>
            <div class="field">
              <label class="label" for={id('on')}>Filed on</label>
              <input id={id('on')} class="input num" type="date" required value={form.filedOn} max={today}
                onInput={(e) => setForm({ ...form, filedOn: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label class="label" for={id('ack')}>Acknowledgement or SRN</label>
              <input id={id('ack')} class="input num" type="text" autocomplete="off" value={form.ack} placeholder="ARN, SRN, challan or ack number"
                onInput={(e) => setForm({ ...form, ack: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label class="label" for={id('fowner')}>Owner</label>
              <input id={id('fowner')} class="input" type="text" list={id('owners')} value={form.owner} placeholder="Who filed it"
                onInput={(e) => setForm({ ...form, owner: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label class="label" for={id('note')}>Note</label>
              <input id={id('note')} class="input" type="text" value={form.note} placeholder="Optional"
                onInput={(e) => setForm({ ...form, note: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="form-actions">
              <button class="btn" type="submit"><span class="btn-label"><Icon name="check" />Save as filed</span><span class="btn-block" /></button>
              <button class="btn btn-quiet" type="button" onClick={() => setEditing(false)}><span class="btn-label">Cancel</span></button>
            </div>
          </form>
        ) : (
          <div class="form-actions">
            <button class="btn" type="button" onClick={() => setEditing(true)}>
              <span class="btn-label"><Icon name="check" />Mark filed</span>
              <span class="btn-block" />
            </button>
            <button class="btn" type="button" onClick={() => downloadFile(`${rule.code}-${occ.periodKey}.ics`, 'text/calendar', occurrenceICS(row))}>
              <span class="btn-label"><Icon name="calendar" />Add to calendar</span>
            </button>
            <button
              class="btn btn-quiet"
              type="button"
              onClick={() => navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
            >
              <span class="btn-label"><Icon name={copied ? 'check' : 'link'} />{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        )}
        <div class="field owner-field">
          <label class="label faint" for={id('owner')}>Owner for {rule.code}</label>
          <input id={id('owner')} class="input" type="text" list={id('owners')} placeholder="Unassigned" value={state.owners[rule.id] ?? ''}
            onChange={(e) => setOwner((e.target as HTMLInputElement).value)} />
          <datalist id={id('owners')}>{owners.map((o) => <option value={o} />)}</datalist>
        </div>
      </section>

      <section class="detail-section">
        <p>{rule.summary}</p>
      </section>

      <section class="detail-section">
        <h3 class="label faint">Who files</h3>
        <p>{rule.applicability}</p>
      </section>

      <section class="detail-section">
        <h3 class="label faint">Cost of a delay</h3>
        {curve && rule.exposure ? (
          <DelayChart exposure={rule.exposure} category={rule.category} days={days} onDays={setDays} idp={id('dc')} />
        ) : (
          <p class="fig delay-cost num">{cost !== null ? <Money inr={cost} /> : 'Not fixed by law'}</p>
        )}
        <ul class="delay-notes">
          {turnover && <li>Penalty of {turnover}</li>}
          {interest && <li>Plus {interest} on the unpaid amount</li>}
          {(rule.exposure?.other ?? []).map((o) => <li>{o}</li>)}
        </ul>
        {rule.penalty && (
          <details class="disclose">
            <summary class="label">Legal basis of the penalty</summary>
            <p>{rule.penalty}</p>
          </details>
        )}
      </section>

      <section class="detail-section">
        <h3 class="label faint">Rule</h3>
        <p>{describeSchedule(rule)}</p>
        <p class="muted">{rule.law}</p>
      </section>

      <section class="detail-section">
        <h3 class="label faint">Sources</h3>
        <ul class="sources">
          {rule.sources.map((s) => (
            <li>
              <a href={s.url} rel="noopener" target="_blank">{s.title}</a>
              {s.kind && <span class="label faint"> {s.kind}</span>}
            </li>
          ))}
        </ul>
        {rule.verified && (
          <p class="label faint verified">
            Verified {formatDate(rule.verified, { weekday: false })} - confidence {rule.confidence}
          </p>
        )}
        {rule.notes && (
          <details class="disclose">
            <summary class="label">Notes and recent changes</summary>
            <p>{rule.notes}</p>
          </details>
        )}
        <p>
          <a class="label" href={`${baseUrl()}o/${rule.id}/`}>Open the full entry</a>
        </p>
      </section>
    </article>
  );
}
