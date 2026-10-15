import { useRef, useState } from 'preact/hooks';
import { downloadFile, useTeamState } from '../lib/client.ts';
import { todayIST } from '../lib/dates.ts';
import {
  DEFAULT_PROFILE,
  ENTITY_LABEL,
  ENTITY_TYPES,
  GST_LABEL,
  isEverything,
  type GstMode,
  type Profile,
} from '../lib/profile.ts';
import { ABROAD, ABROAD_LABEL } from '../lib/abroad.ts';
import { exportState, importState, type TeamState } from '../lib/store.ts';
import { STATE_CODES, STATE_NAME } from '../lib/validate.ts';
import { Icon } from './Icon.tsx';

const SWITCHES: { key: keyof Profile; label: string; hint: string }[] = [
  { key: 'tds', label: 'We deduct or collect tax at source', hint: 'TDS and TCS deposits, statements and certificates' },
  { key: 'employer', label: 'We have employees', hint: 'EPF, ESI, professional tax, labour welfare fund, labour codes' },
  { key: 'audit', label: 'Our accounts are audited', hint: 'Tax audit and the October return date' },
  { key: 'transferPricing', label: 'We have international or specified domestic transactions', hint: 'Transfer-pricing report, master file' },
  { key: 'foreign', label: 'We have foreign investment or borrowing', hint: 'FDI, ODI, ECB and the FLA return' },
  { key: 'importExport', label: 'We import or export', hint: 'IEC annual update' },
];

export default function ProfileButton() {
  const [team, saveTeam] = useTeamState();
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [message, setMessage] = useState('');

  const open = () => {
    if (!team) return;
    setDraft({ ...team.profile });
    setMessage('');
    dialog.current?.showModal();
  };

  const save = (e: Event) => {
    e.preventDefault();
    if (!team || !draft) return;
    saveTeam({ ...team, profile: { ...draft, name: draft.name.trim() || 'Our entity' } });
    dialog.current?.close();
  };

  const onImport = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !team) return;
    try {
      const { state, filedAdded } = importState(team, await file.text());
      saveTeam(state);
      setMessage(`Imported. ${filedAdded} filed ${filedAdded === 1 ? 'record' : 'records'} added; newer filing dates replaced older ones.`);
    } catch {
      setMessage('That file is not an India Compliance Calendar export. Nothing was changed.');
    }
    (e.target as HTMLInputElement).value = '';
  };

  const label = team ? (isEverything(team.profile) ? 'All obligations' : team.profile.name) : 'Profile';
  const set = (patch: Partial<Profile>) => draft && setDraft({ ...draft, ...patch });

  return (
    <>
      <button type="button" class="btn profile-btn" onClick={open} aria-haspopup="dialog" disabled={!team} aria-label={`Entity profile: ${label}`}>
        <span class="btn-label">
          <Icon name="user" />
          <span class="profile-name" aria-hidden="true">{label}</span>
        </span>
      </button>
      <dialog ref={dialog} class="sheet profile-sheet" aria-labelledby="profile-title">
        {draft && team && (
          <form class="profile-form" onSubmit={save}>
            <header class="sheet-head">
              <h2 id="profile-title" class="label">Entity profile</h2>
              <button type="button" class="btn btn-quiet" onClick={() => dialog.current?.close()} aria-label="Close">
                <span class="btn-label"><Icon name="x" /></span>
              </button>
            </header>
            <p class="muted">
              The calendar shows only what applies to this profile. It is stored in this browser; export it to share filed
              records with the team.
            </p>

            <div class="field">
              <label class="label" for="p-name">Name</label>
              <input id="p-name" class="input" type="text" value={draft.name === DEFAULT_PROFILE.name ? '' : draft.name}
                placeholder="Our company" onInput={(e) => set({ name: (e.target as HTMLInputElement).value })} />
            </div>

            <div class="field-row">
              <div class="field">
                <label class="label" for="p-entity">Entity type</label>
                <select id="p-entity" class="select" value={draft.entity}
                  onChange={(e) => set({ entity: (e.target as HTMLSelectElement).value as Profile['entity'] })}>
                  {ENTITY_TYPES.map((t) => <option value={t}>{ENTITY_LABEL[t]}</option>)}
                </select>
              </div>
              <div class="field">
                <label class="label" for="p-gst">GST</label>
                <select id="p-gst" class="select" value={draft.gst}
                  onChange={(e) => set({ gst: (e.target as HTMLSelectElement).value as GstMode })}>
                  {(Object.keys(GST_LABEL) as GstMode[]).map((g) => <option value={g}>{GST_LABEL[g]}</option>)}
                </select>
              </div>
            </div>

            <fieldset class="switches">
              <legend class="label">Activities</legend>
              {SWITCHES.map((s) => (
                <label class="switch">
                  <input type="checkbox" checked={Boolean(draft[s.key])}
                    onChange={(e) => set({ [s.key]: (e.target as HTMLInputElement).checked } as Partial<Profile>)} />
                  <span>
                    {s.label}
                    <span class="faint switch-hint">{s.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset class="states">
              <legend class="label">States where we operate</legend>
              <p class="faint">Used for professional tax, labour welfare fund and the GST quarterly due-date groups. None selected shows every state.</p>
              <div class="state-grid">
                {STATE_CODES.map((c) => (
                  <label class="state-chip">
                    <input type="checkbox" checked={draft.states.includes(c)}
                      onChange={(e) => set({ states: (e.target as HTMLInputElement).checked ? [...draft.states, c] : draft.states.filter((x) => x !== c) })} />
                    <span title={STATE_NAME[c]}>{STATE_NAME[c]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset class="abroad">
              <legend class="label">Holidays abroad</legend>
              <p class="faint">Shown beside the Indian holidays in the calendar and the overview. They never move an Indian due date.</p>
              <div class="state-grid">
                {ABROAD.map((s) => (
                  <label class="state-chip">
                    <input type="checkbox" checked={(draft.abroad ?? []).includes(s)}
                      onChange={(e) => set({ abroad: (e.target as HTMLInputElement).checked ? [...(draft.abroad ?? []), s] : (draft.abroad ?? []).filter((x) => x !== s) })} />
                    <span>{ABROAD_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset class="team-data">
              <legend class="label">Team records</legend>
              <p class="faint">
                {Object.keys(team.filed).length} filed records - tracking since {team.trackingSince}. Overdue items count only from
                that date.
              </p>
              <div class="form-actions">
                <button type="button" class="btn" onClick={() => downloadFile(`compliance-records-${todayIST()}.json`, 'application/json', exportState(team))}>
                  <span class="btn-label"><Icon name="download" />Export records</span>
                </button>
                <button type="button" class="btn" onClick={() => fileInput.current?.click()}>
                  <span class="btn-label"><Icon name="upload" />Import a teammate's export</span>
                </button>
                <input ref={fileInput} type="file" accept="application/json,.json" class="visually-hidden" onChange={onImport} tabIndex={-1} />
              </div>
              {message && <p role="status" class="muted">{message}</p>}
            </fieldset>

            <footer class="sheet-foot">
              <button type="button" class="btn btn-quiet" onClick={() => setDraft({ ...DEFAULT_PROFILE })}>
                <span class="btn-label">Show everything</span>
              </button>
              <button type="submit" class="btn">
                <span class="btn-label"><Icon name="check" />Save profile</span>
                <span class="btn-block" />
              </button>
            </footer>
          </form>
        )}
      </dialog>
    </>
  );
}
