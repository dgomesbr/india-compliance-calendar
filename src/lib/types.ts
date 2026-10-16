// Shared data model. Plain, erasable TypeScript only (no enums, namespaces or
// parameter properties) so Node can run these files directly for the MCP
// server and scripts.

export const CATEGORIES = [
  'income-tax',
  'gst',
  'mca',
  'sebi',
  'rbi-fema',
  'labour',
  'state',
  'trade',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  'income-tax': 'Income tax',
  gst: 'GST',
  mca: 'MCA and LLP',
  sebi: 'SEBI',
  'rbi-fema': 'RBI and FEMA',
  labour: 'Labour',
  state: 'State levies',
  trade: 'Foreign trade',
  other: 'Other regulators',
};

export const CATEGORY_SHORT: Record<Category, string> = {
  'income-tax': 'Income tax',
  gst: 'GST',
  mca: 'MCA',
  sebi: 'SEBI',
  'rbi-fema': 'FEMA',
  labour: 'Labour',
  state: 'State',
  trade: 'Trade',
  other: 'Other',
};

export const AUDIENCES = [
  'company',
  'listed',
  'llp',
  'firm',
  'individual',
  'trust',
  'employer',
  'gst',
  'tds',
  'foreign',
  'audit',
  'importer-exporter',
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABEL: Record<Audience, string> = {
  company: 'Companies',
  listed: 'Listed entities',
  llp: 'LLPs',
  firm: 'Partnership firms',
  individual: 'Individuals and HUFs',
  trust: 'Trusts and NGOs',
  employer: 'Employers',
  gst: 'GST registrants',
  tds: 'TDS and TCS deductors',
  foreign: 'Foreign investment and borrowing',
  audit: 'Audit and transfer-pricing cases',
  'importer-exporter': 'Importers and exporters',
};

export const FREQUENCIES = [
  'monthly',
  'quarterly',
  'half-yearly',
  'annual',
  'every-n-years',
  'event',
  'one-time',
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-yearly',
  annual: 'Annual',
  'every-n-years': 'Every few years',
  event: 'After an event',
  'one-time': 'One time',
};

export type ScheduleKind = 'monthly' | 'quarterly' | 'half-yearly' | 'annual' | 'every-n-years' | 'fixed';

/** A span of months then days; negative for "before". */
export interface Offset {
  months?: number;
  days?: number;
  /** From a month's last day, land on the target month's last day (CBDT's "one month before 30 November" is 31 October). */
  monthEnd?: boolean;
}

/** How a due date is placed relative to the end of its period. */
export interface DueSpec {
  /** Day of the target month; "last" for the month end. Clamped to month length. */
  day?: number | 'last';
  /** Months after the period's last month (0 = same month). */
  monthOffset?: number;
  /** Alternative: calendar days after the period end date. */
  daysAfter?: number;
  /** Alternative: working days (Mon-Fri, not a central holiday) after period end. */
  workingDaysAfter?: number;
  /**
   * Exact placement, preferred when present: N months (the same date, clamped) then N days
   * after the period end. Rules that follow the entity's own financial year use it, because a
   * fixed `day` only fits a March year end; `day` and `monthOffset` stay for older readers.
   */
  after?: Offset;
}

/** This rule's clock starts from another rule's occurrence for the same period. */
export interface Follows {
  /** The earlier rule, e.g. the AGM for AOC-4. */
  rule: string;
  /** Which period of the earlier rule, when it runs more often (e.g. "Q4" for an annual rule). */
  slot?: string;
  /** Time from the earlier occurrence; negative for "before" (the annual report goes out before the AGM). */
  within: Offset;
  /** "done" (default): the date recorded for the earlier step, else its due date. "due": always its due date. */
  from?: 'done' | 'due';
  /** "Whichever is earlier": the rule keeps its own date and a recorded earlier step can only bring it forward. */
  earlier?: boolean;
}

export interface FixedDate {
  due: string;
  period: string;
  label?: string;
}

export interface Schedule extends DueSpec {
  kind: ScheduleKind;
  /** FY quarters/halves/years (Apr-Mar) or calendar ones (Jan-Dec). */
  basis?: 'fy' | 'calendar';
  /**
   * Periods follow the entity's own financial year (company law, LLP, SEBI, the FEMA activity
   * certificate): April to March unless the profile sets another approved year. Income tax and
   * GST never do. Readers that ignore it get the April-March dates.
   */
  entityYear?: boolean;
  /** Placed from another rule's occurrence instead of from the period end. */
  follows?: Follows;
  /** Per-period overrides keyed "1".."12", "Q1".."Q4", "H1"/"H2". */
  except?: Record<string, DueSpec>;
  /** Periods without an occurrence, same key format as except. */
  skip?: string[];
  everyYears?: number;
  /** Anchor period for every-n-years, e.g. "FY2027-28". */
  anchor?: string;
  dates?: FixedDate[];
}

export interface Source {
  title: string;
  url: string;
  kind?: string;
}

export interface Override {
  /** Period key: "2026-08", "FY2026-27-Q1", "FY2026-27-H1", "FY2025-26", "CY2026". */
  period: string;
  due: string;
  originalDue?: string;
  reason: string;
  source?: Source;
}

export interface Exposure {
  lateFeePerDay?: number | null;
  lateFeeCap?: number | null;
  fixedPenalty?: number | null;
  maxPenalty?: number | null;
  interestPctPerMonth?: number | null;
  interestPctPerAnnum?: number | null;
  percentOfTurnover?: number | null;
  other?: string[];
  basis?: string;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface Rule {
  id: string;
  /** Short catalog code shown as the obligation's number, e.g. "GSTR-3B". */
  code: string;
  title: string;
  form?: string;
  category: Category;
  authority: string;
  summary: string;
  applicability: string;
  audience: Audience[];
  frequency: Frequency;
  schedule?: Schedule;
  trigger?: string;
  law: string;
  penalty?: string;
  exposure?: Exposure;
  states?: string[];
  effective?: { from?: string | null; to?: string | null };
  overrides?: Override[];
  sources: Source[];
  verified: string;
  confidence: Confidence;
  notes?: string;
  /** Applicability refinements, e.g. "gst-monthly", "gst-qrmp", "opc-small". */
  tags?: string[];
  /** What recording it means: a return is filed, a meeting is held. Default "filed". */
  recordAs?: 'filed' | 'held';
  /**
   * Another rule for the same event under a different deadline (the AGM of a top 100 listed
   * entity, due in five months, is the same meeting as the Companies Act AGM). Its record is
   * kept under that rule, so recording either moves everything that runs from the meeting.
   */
  sameEventAs?: string;
}

/** Where an occurrence's date comes from when its rule follows another. */
export interface ChainLink {
  /** The earlier rule and its occurrence key. */
  ruleId: string;
  key: string;
  /** The date the clock runs from. */
  date: string;
  /** "done": the date recorded for the earlier step. "due": its due date. */
  from: 'done' | 'due';
  within: Offset;
  /** A "whichever is earlier" chain. */
  earlier?: boolean;
  /** For "earlier" chains: the recorded step brought this date forward. */
  moved?: boolean;
}

export interface Occurrence {
  /** Stable key: `${ruleId}@${periodKey}`. Used for filed status and ICS UIDs. */
  key: string;
  ruleId: string;
  due: string;
  /** Statutory date when an override moved it. */
  originalDue?: string;
  periodKey: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  extended?: { reason: string; source?: Source };
  /** Computed from the standing rule beyond the verified window. */
  projected: boolean;
  /** Set when the rule follows another: the earlier occurrence and the date it ran from. */
  chain?: ChainLink;
}

export interface Holiday {
  date: string;
  name: string;
  /** The holiday's own date, when the list gives the observed or closure date instead. */
  actual?: string;
  note?: string;
}

export interface HolidayList {
  id: string;
  title: string;
  /** "statutory" covers public and federal holidays abroad (Canada, Ontario, United States). */
  kind: 'gazetted' | 'restricted' | 'bank' | 'exchange-trading' | 'exchange-settlement' | 'statutory';
  scope: string;
  year: number;
  authority: string;
  source: Source;
  verified: string;
  confidence: Confidence;
  notes?: string;
  alsoSee?: Source[];
  holidays: Holiday[];
}

export interface EventStep {
  /** Rule this step points to, when the calendar has one. */
  ruleId?: string;
  code: string;
  title: string;
  /** Deadline after the event: N days or N months. */
  within: { days?: number; months?: number };
  /** Some steps are due before the event (negative days), e.g. notice periods. */
  note?: string;
  law: string;
  audience?: Audience[];
  source?: Source;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  category: Category;
  steps: EventStep[];
}

export interface Update {
  id: string;
  source: string;
  sourceName: string;
  title: string;
  url: string;
  date: string;
  category?: Category;
}

export interface Meta {
  generated: string;
  /** Dates up to here were checked against sources; later ones are projected. */
  confirmedThrough: string;
  site: string;
  version: string;
  counts: { rules: number; categories: Record<string, number> };
}

export interface Bundle {
  meta: Meta;
  rules: Rule[];
  holidays: HolidayList[];
  events: EventType[];
  /** Bank of Canada rates for the CAD and USD reference amounts (data/fx.json). */
  fx?: import('./money.ts').Fx;
}
