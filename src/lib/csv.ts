// RFC 4180 CSV.

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** CSV that Excel opens cleanly: a UTF-8 byte order mark first, so names keep their characters. */
export function toExcelCSV(header: string[], rows: unknown[][]): string {
  return String.fromCharCode(0xfeff) + toCSV(header, rows);
}

/** Tab-separated text for the clipboard: Excel and Sheets paste it straight into columns. */
export function toTSV(header: string[], rows: unknown[][]): string {
  const cell = (v: unknown) => (v === null || v === undefined ? '' : String(v).replace(/[\t\r\n]+/g, ' '));
  return [header, ...rows].map((r) => r.map(cell).join('\t')).join('\r\n') + '\r\n';
}
