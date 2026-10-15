// iCalendar (RFC 5545) output for subscriptions and single-event downloads.

import { addDays, type ISODate } from './dates.ts';

export interface CalendarEvent {
  uid: string;
  date: ISODate;
  summary: string;
  description?: string;
  url?: string;
  categories?: string[];
  /** Reminder offsets in days before the due date. */
  alarmsDaysBefore?: number[];
}

export interface CalendarOptions {
  name: string;
  description?: string;
  /** DTSTAMP for every event; pass the build time so output is reproducible. */
  stamp: Date;
  refreshHours?: number;
  events: CalendarEvent[];
}

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

const encoder = new TextEncoder();

/** Fold a content line to 75 octets per RFC 5545 section 3.1. */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (size + n > limit) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

function stampUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function dateValue(date: ISODate): string {
  return date.replace(/-/g, '');
}

export function buildCalendar(opts: CalendarOptions): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//India Compliance Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];
  if (opts.description) lines.push(`X-WR-CALDESC:${escapeText(opts.description)}`);
  const refresh = opts.refreshHours ?? 12;
  lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${refresh}H`, `X-PUBLISHED-TTL:PT${refresh}H`);
  const stamp = stampUTC(opts.stamp);
  for (const ev of opts.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateValue(ev.date)}`,
      `DTEND;VALUE=DATE:${dateValue(addDays(ev.date, 1))}`,
      `SUMMARY:${escapeText(ev.summary)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.categories?.length) lines.push(`CATEGORIES:${ev.categories.map(escapeText).join(',')}`);
    lines.push('TRANSP:TRANSPARENT');
    for (const days of ev.alarmsDaysBefore ?? []) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(ev.summary)}`,
        `TRIGGER:-P${days}D`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
