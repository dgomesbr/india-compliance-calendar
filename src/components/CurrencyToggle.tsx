import { useTeamState } from '../lib/client.ts';
import { CURRENCY_LABEL, DEFAULT_CURRENCY, REF_CURRENCIES } from '../lib/money.ts';
import { withPrefs } from '../lib/store.ts';

/** Masthead switch for the reference currency shown beside rupee amounts. */
export default function CurrencyToggle() {
  const [team, saveTeam] = useTeamState();
  const cur = team?.prefs.currency ?? DEFAULT_CURRENCY;
  return (
    <div class="cur-toggle" role="group" aria-label="Reference currency for amounts">
      {REF_CURRENCIES.map((c) => (
        <button
          type="button"
          class={`cur-btn${cur === c ? ' is-on' : ''}`}
          aria-pressed={cur === c}
          disabled={!team}
          title={`Show amounts in ${CURRENCY_LABEL[c]}, with the rupee figure in brackets`}
          onClick={() => team && saveTeam(withPrefs(team, { currency: c }))}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
