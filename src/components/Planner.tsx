import { useMemo, useState } from 'preact/hooks';
import { baseUrl, downloadFile, useBundle, useTeamState, useToday } from '../lib/client.ts';
import { diffDays, formatDate, relativeDays, type ISODate } from '../lib/dates.ts';
import { buildCalendar } from '../lib/ics.ts';
import { CATEGORY_LABEL, type EventType } from '../lib/types.ts';
import { eventOccurrences } from '../lib/view.ts';
import { Icon } from './Icon.tsx';

function within(step: EventType['steps'][number]): string {
  const parts: string[] = [];
  if (step.within.months) parts.push(`${step.within.months} ${step.within.months === 1 ? 'month' : 'months'}`);
  if (step.within.days !== undefined) {
    const d = step.within.days;
    if (d < 0) return `${-d} days before`;
    if (d === 0 && !parts.length) return 'Same day';
    if (d) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  }
  return `Within ${parts.join(' and ')}`;
}

export default function Planner() {
  const data = useBundle();
  const [team, saveTeam] = useTeamState();
  const today = useToday();
  const [eventId, setEventId] = useState('');
  const [date, setDate] = useState<ISODate>(today);
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState('');

  const events = data.status === 'ready' ? data.data.events : [];
  const ev = events.find((e) => e.id === eventId) ?? events[0];
  const steps = useMemo(() => (ev ? eventOccurrences(ev, date, null) : []), [ev, date]);

  if (data.status === 'error') return <p class="page" role="alert">{data.message}</p>;
  if (data.status === 'loading' || !team) return <div class="page"><div class="skeleton" style="height:320px;margin-top:32px" /></div>;
  if (!ev) return <p class="page muted">No event types are defined yet.</p>;

  const add = () => {
    const id = `${ev.id}-${date}-${Date.now().toString(36)}`;
    saveTeam({ ...team, planned: [...team.planned, { id, eventId: ev.id, date, label: label.trim() || undefined, created: today }] });
    setSaved(`Added ${ev.steps.length} deadlines to the overview and calendar.`);
  };
  const remove = (id: string) => saveTeam({ ...team, planned: team.planned.filter((p) => p.id !== id) });

  const ics = () =>
    buildCalendar({
      name: `${label || ev.title} - deadlines`,
      stamp: new Date(),
      events: steps.map((o, i) => ({
        uid: `${ev.id}-${date}-${i}@india-compliance-calendar`,
        date: o.due,
        summary: `${ev.steps[i].code} due - ${label || ev.title}`,
        description: `${ev.steps[i].title}. ${within(ev.steps[i])} of ${ev.title.toLowerCase()} on ${formatDate(date)}.\nLaw: ${ev.steps[i].law}\nInformation only, not legal advice.`,
        url: `${location.origin}${baseUrl()}planner/`,
        alarmsDaysBefore: [3, 1],
      })),
    });

  return (
    <div class="page planner">
      <header class="planner-head">
        <h1 class="cat planner-title">Event planner</h1>
        <p class="muted planner-lede">
          Some deadlines run from something that happened, not from the calendar. Pick the event and its date to get every
          filing that follows from it, then add them to the overview.
        </p>
      </header>

      <form class="planner-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div class="field">
          <label class="caps" for="pl-event">Event</label>
          <select id="pl-event" class="select" value={ev.id} onChange={(e) => { setEventId((e.target as HTMLSelectElement).value); setSaved(''); }}>
            {events.map((x) => <option value={x.id}>{x.title}</option>)}
          </select>
        </div>
        <div class="field">
          <label class="caps" for="pl-date">Date of the event</label>
          <input id="pl-date" class="input num" type="date" required value={date} onInput={(e) => { setDate((e.target as HTMLInputElement).value); setSaved(''); }} />
        </div>
        <div class="field">
          <label class="caps" for="pl-label">Label</label>
          <input id="pl-label" class="input" type="text" placeholder="Optional, e.g. AGM 2026" value={label} onInput={(e) => setLabel((e.target as HTMLInputElement).value)} />
        </div>
        <div class="form-actions planner-actions">
          <button class="btn" type="submit"><span class="btn-label"><Icon name="plus" />Add to our calendar</span><span class="btn-block" /></button>
          <button class="btn" type="button" onClick={() => downloadFile(`${ev.id}-${date}.ics`, 'text/calendar', ics())}>
            <span class="btn-label"><Icon name="calendar" />Download ICS</span>
          </button>
        </div>
        {saved && <p class="muted" role="status">{saved}</p>}
      </form>

      <section class="planner-result" aria-labelledby="pl-result">
        <h2 id="pl-result" class="caps faint">
          {ev.title} - {CATEGORY_LABEL[ev.category]}
        </h2>
        <p class="muted">{ev.description}</p>
        <table class="obl planner-table">
          <thead>
            <tr>
              <th scope="col" class="caps">Due</th>
              <th scope="col" class="caps">Obligation</th>
              <th scope="col" class="caps">Time limit</th>
              <th scope="col" class="caps">Law</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((o, i) => {
              const step = ev.steps[i];
              const left = diffDays(today, o.due);
              return (
                <tr class="obl-row">
                  <td class="col-due num">
                    <span class="due-date">{formatDate(o.due)}</span>
                    <span class={`due-left${left < 0 ? ' state-overdue' : left <= 7 ? ' state-soon' : ''}`}>{relativeDays(today, o.due)}</span>
                  </td>
                  <td class="col-code">
                    <span class="obl-code cat">{step.code}</span>
                    <span class="obl-title">{step.title}</span>
                    {step.note && <span class="obl-period faint">{step.note}</span>}
                  </td>
                  <td class="muted">{within(step)}</td>
                  <td class="muted">
                    {step.source ? <a href={step.source.url} rel="noopener" target="_blank">{step.law}</a> : step.law}
                    {step.ruleId && <> - <a href={`${baseUrl()}o/${step.ruleId}/`}>entry</a></>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section class="planner-saved" aria-labelledby="pl-saved">
        <h2 id="pl-saved" class="caps faint">Planned events</h2>
        {team.planned.length === 0 ? (
          <p class="faint">Nothing planned yet. Events you add appear here and their deadlines join the overview.</p>
        ) : (
          <ul>
            {team.planned
              .slice()
              .sort((a, b) => (a.date < b.date ? -1 : 1))
              .map((p) => {
                const pe = events.find((x) => x.id === p.eventId);
                return (
                  <li class="planned-item">
                    <span>
                      <span class="cat">{p.label || pe?.title || p.eventId}</span>
                      <span class="faint num"> - {formatDate(p.date)}{pe ? ` - ${pe.steps.length} deadlines` : ''}</span>
                    </span>
                    <button type="button" class="btn btn-quiet" onClick={() => remove(p.id)} aria-label={`Remove ${p.label || pe?.title}`}>
                      <span class="btn-label"><Icon name="trash" />Remove</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </div>
  );
}
