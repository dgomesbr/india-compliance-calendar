// Calendar dates as "YYYY-MM-DD" strings. All arithmetic runs on UTC midnight
// so results never shift with the viewer's time zone; "today" is taken in IST
// because every obligation here is Indian.

export type ISODate = string;

const MS_DAY = 86_400_000;
const IST_OFFSET_MS = 330 * 60_000;

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function iso(y: number, m: number, d: number): ISODate {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function parts(date: ISODate): { y: number; m: number; d: number } {
  return { y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)), d: Number(date.slice(8, 10)) };
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parts(value);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function toUTC(date: ISODate): number {
  const { y, m, d } = parts(date);
  return Date.UTC(y, m - 1, d);
}

export function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Today's date in India Standard Time. */
export function todayIST(now: number = Date.now()): ISODate {
  return fromUTC(now + IST_OFFSET_MS);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(date: ISODate, n: number): ISODate {
  return fromUTC(toUTC(date) + n * MS_DAY);
}

/** Month arithmetic on (year, month) pairs; month is 1-12. */
export function shiftMonth(y: number, m: number, offset: number): { y: number; m: number } {
  const index = y * 12 + (m - 1) + offset;
  return { y: Math.floor(index / 12), m: (index % 12 + 12) % 12 + 1 };
}

/** Same day N months later, clamped to the target month's length. */
export function addMonths(date: ISODate, n: number): ISODate {
  const { y, m, d } = parts(date);
  const t = shiftMonth(y, m, n);
  return iso(t.y, t.m, Math.min(d, daysInMonth(t.y, t.m)));
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_DAY);
}

export function weekday(date: ISODate): number {
  return new Date(toUTC(date)).getUTCDay();
}

export function isWeekend(date: ISODate): boolean {
  const w = weekday(date);
  return w === 0 || w === 6;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function lastDayOfMonth(y: number, m: number): ISODate {
  return iso(y, m, daysInMonth(y, m));
}

/** Start year of the Indian financial year (April-March) containing the date. */
export function fyStartYear(date: ISODate): number {
  const { y, m } = parts(date);
  return m >= 4 ? y : y - 1;
}

export function fyLabel(startYear: number): string {
  return `FY ${startYear}-${pad2((startYear + 1) % 100)}`;
}

export function fyKey(startYear: number): string {
  return `FY${startYear}-${pad2((startYear + 1) % 100)}`;
}

export function fyEnd(date: ISODate): ISODate {
  return iso(fyStartYear(date) + 1, 3, 31);
}

/** "Tue 20 Oct 2026" */
export function formatDate(date: ISODate, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const { y, m, d } = parts(date);
  const w = opts.weekday === false ? '' : `${WEEKDAYS_SHORT[weekday(date)]} `;
  const yr = opts.year === false ? '' : ` ${y}`;
  return `${w}${d} ${MONTHS_SHORT[m - 1]}${yr}`;
}

/** "20 October 2026" */
export function formatLong(date: ISODate): string {
  const { y, m, d } = parts(date);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export function monthLabel(y: number, m: number): string {
  return `${MONTHS_SHORT[m - 1]} ${y}`;
}

/** Human distance from today: "Today", "Tomorrow", "In 6 days", "3 days late". */
export function relativeDays(today: ISODate, date: ISODate): string {
  const n = diffDays(today, date);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return '1 day ago';
  if (n < 0) return `${-n} days ago`;
  return `In ${n} days`;
}
