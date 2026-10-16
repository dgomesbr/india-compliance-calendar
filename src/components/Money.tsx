import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { moneyFormat, type MoneyFormat } from '../lib/money.ts';

/** The island's amount formatting (reference currency and rates); rupees only until a rate loads. */
export const MoneyContext = createContext<MoneyFormat>(moneyFormat(null));

export function useMoneyFormat(): MoneyFormat {
  return useContext(MoneyContext);
}

/**
 * An amount in the reference currency with the rupee figure beside it in brackets, or
 * beneath it in small type when stacked. Without a rate it shows the rupee figure alone.
 */
export function Money({ inr, compact = false, stack = false }: { inr: number; compact?: boolean; stack?: boolean }) {
  const money = useMoneyFormat();
  const ref = money.ref(inr, compact);
  if (!ref) return <span class="money">{money.inr(inr, compact)}</span>;
  return (
    <span class={`money${stack ? ' is-stacked' : ''}`}>
      <span class="money-ref">{ref}</span>
      <span class="money-inr">({money.inr(inr, compact)})</span>
    </span>
  );
}
