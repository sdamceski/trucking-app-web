'use client';

import { useState } from 'react';
import { Field, inputCx } from './form';

export default function LoadPricingFields({
  defaultLoadPrice,
  defaultTruckerRate,
}: {
  defaultLoadPrice: number;
  defaultTruckerRate: number;
}) {
  const [loadPrice, setLoadPrice] = useState(defaultLoadPrice);
  const [truckerRate, setTruckerRate] = useState(defaultTruckerRate);
  const [overridden, setOverridden] = useState(defaultTruckerRate > 0);

  return (
    <Field
      label="Load price ($)"
      hint={
        overridden
          ? undefined
          : 'Trucker is paid the full load price unless overridden.'
      }
    >
      <div className="relative">
        <input
          name="loadPrice"
          type="number"
          step="0.01"
          min={0}
          value={loadPrice}
          onChange={(e) => setLoadPrice(Number(e.target.value) || 0)}
          className={inputCx + ' pr-32'}
        />
        <button
          type="button"
          onClick={() => {
            const next = !overridden;
            setOverridden(next);
            if (!next) setTruckerRate(0);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          aria-pressed={overridden}
        >
          {overridden ? '✕ Pay-through' : 'Override pay'}
        </button>
      </div>

      {overridden ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Trucker rate ($)
          </label>
          <input
            name="truckerRate"
            type="number"
            step="0.01"
            min={0}
            value={truckerRate}
            onChange={(e) => setTruckerRate(Number(e.target.value) || 0)}
            className={inputCx + ' mt-1'}
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">
            Margin: ${Math.max(0, loadPrice - truckerRate).toFixed(2)}
          </p>
        </div>
      ) : (
        <input type="hidden" name="truckerRate" value={0} />
      )}
    </Field>
  );
}
