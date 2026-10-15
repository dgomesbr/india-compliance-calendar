import { useEffect, useState } from 'preact/hooks';
import { baseUrl, downloadFile } from '../lib/client.ts';
import { formatDate, formatLong, relativeDays, todayIST, type ISODate } from '../lib/dates.ts';
import { delayCost, formatINR, interestNote, turnoverNote } from '../lib/exposure.ts';
import { buildCalendar } from '../lib/ics.ts';
import { describeSchedule } from '../lib/schedule.ts';
import type { TeamState } from '../lib/store.ts';
import { CATEGORY_LABEL } from '../lib/types.ts';
import { STATE_LABEL, STATE_VAR, categoryIndex, type Row } from '../lib/view.ts';
import { Icon } from './Icon.tsx';

export function Strip({ row }: { row: Row }) {
  const lit = categoryIndex(row.rule.category);
  return (
    <span class="strip" style={{ '--state': STATE_VAR[row.state] }} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span class={i === lit ? 'lit' : ''} />
      ))}
    </span>
  );
}

interface Props {
  row: Row;
  today: ISODate;
  state: TeamState;
  onSave: (next: TeamState) => void;
  onClose: () => void;
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

export default function Detail({ row, today, state, onSave, onClose }: Props) {
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

  const owners = [...new Set([...Object.values(state.owners), ...Object.values(state.filed).map((f) => f.owner ?? '')])].filter(Boolean);
  const cost = delayCost(rule.exposure, days);
  const interest = interestNote(rule.exposure);
  const turnover = turnoverNote(rule.exposure);
  const link = `${location.origin}${baseUrl()}o/${rule.id}/`;

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
    <article class="detail" aria-labelledby="detail-code">
      <header class="detail-head">
        <div class="detail-meta">
          <Strip row={row} />
          <span class="caps muted">{CATEGORY_LABEL[rule.category]}</span>
          <span class="caps faint">{rule.authority}</span>
        </div>
        <button class="btn btn-quiet detail-close" type="button" onClick={onClose} aria-label="Close details">
          <span class="btn-label"><Icon name="x" /></span>
        </button>
      </header>

      <h2 id="detail-code" class="cat detail-code">{rule.code}</h2>
      <p class="detail-title">{rule.title}</p>
      <p class="caps muted detail-period">{occ.periodLabel}</p>

      <dl class="detail-due">
        <div>
          <dt class="caps faint">Due</dt>
          <dd class="num">{formatLong(occ.due)}</dd>
        </div>
        <div>
          <dt class="caps faint">When</dt>
          <dd class={`num state-${row.state}`}>{row.state === 'filed' ? 'Filed' : relativeDays(today, occ.due)}</dd>
        </div>
        <div>
          <dt class="caps faint">State</dt>
          <dd><span class="tag" data-state={row.state === 'upcoming' ? undefined : row.state}>{STATE_LABEL[row.state]}</span></dd>
        </div>
      </dl>

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
              <label class="caps" for="f-on">Filed on</label>
              <input id="f-on" class="input num" type="date" required value={form.filedOn} max={today}
                onInput={(e) => setForm({ ...form, filedOn: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label class="caps" for="f-ack">Acknowledgement or SRN</label>
              <input id="f-ack" class="input num" type="text" autocomplete="off" value={form.ack} placeholder="ARN, SRN, challan or ack number"
                onInput={(e) => setForm({ ...form, ack: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="field">
              <label class="caps" for="f-owner">Owner</label>
              <input id="f-owner" class="input" type="text" list="owners" value={form.owner} placeholder="Who filed it"
                onInput={(e) => setForm({ ...form, owner: (e.target as HTMLInputElement).value })} />
              <datalist id="owners">{owners.map((o) => <option value={o} />)}</datalist>
            </div>
            <div class="field">
              <label class="caps" for="f-note">Note</label>
              <input id="f-note" class="input" type="text" value={form.note} placeholder="Optional"
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
              <span class="btn-label"><Icon name="link" />{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        )}
        <div class="field owner-field">
          <label class="caps faint" for="d-owner">Owner for {rule.code}</label>
          <input id="d-owner" class="input" type="text" list="owners" placeholder="Unassigned" value={state.owners[rule.id] ?? ''}
            onChange={(e) => setOwner((e.target as HTMLInputElement).value)} />
        </div>
      </section>

      <section class="detail-section">
        <p>{rule.summary}</p>
      </section>

      <section class="detail-section">
        <h3 class="caps faint">Who files</h3>
        <p>{rule.applicability}</p>
      </section>

      <section class="detail-section">
        <h3 class="caps faint">Cost of a delay</h3>
        <div class="delay">
          <label class="caps muted" for="d-days">Days late</label>
          <input id="d-days" type="range" min={1} max={365} value={days} onInput={(e) => setDays(Number((e.target as HTMLInputElement).value))} />
          <output for="d-days" class="num">{days}</output>
        </div>
        <p class="cat delay-cost num">{cost !== null ? formatINR(cost) : 'Not fixed by law'}</p>
        <ul class="delay-notes">
          {turnover && <li>Penalty of {turnover}</li>}
          {interest && <li>Plus {interest} on the unpaid amount</li>}
          {(rule.exposure?.other ?? []).map((o) => <li>{o}</li>)}
        </ul>
        {rule.penalty && (
          <details class="disclose">
            <summary class="caps">Legal basis of the penalty</summary>
            <p>{rule.penalty}</p>
          </details>
        )}
      </section>

      <section class="detail-section">
        <h3 class="caps faint">Rule</h3>
        <p>{describeSchedule(rule)}</p>
        <p class="muted">{rule.law}</p>
      </section>

      <section class="detail-section">
        <h3 class="caps faint">Sources</h3>
        <ul class="sources">
          {rule.sources.map((s) => (
            <li>
              <a href={s.url} rel="noopener" target="_blank">{s.title}</a>
              {s.kind && <span class="caps faint"> {s.kind}</span>}
            </li>
          ))}
        </ul>
        {rule.verified && (
          <p class="caps faint verified">
            Verified {formatDate(rule.verified, { weekday: false })} - confidence {rule.confidence}
          </p>
        )}
        {rule.notes && (
          <details class="disclose">
            <summary class="caps">Notes and recent changes</summary>
            <p>{rule.notes}</p>
          </details>
        )}
        <p>
          <a class="caps" href={`${baseUrl()}o/${rule.id}/`}>Open the full entry</a>
        </p>
      </section>
    </article>
  );
}
