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
}
