'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPayout } from '@/lib/actions/payouts';
import type { RecurringFee } from '@/lib/types';
import { btnPrimary, btnSecondary, inputCx, Field } from './form';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export interface EligibleLoadPreview {
  id: string;
  ref: string;
  originCompany: string;
  destinationCompany: string;
  pickupDate: string;
  base: number;
  feesTotal: number;
  truckerPayout: number;
}

export default function NewPayoutForm({
  truckerId,
  truckerName,
  loads,
  recurringFees,
  defaultPeriodStart = '',
  defaultPeriodEnd = '',
}: {
  truckerId: string;
  truckerName: string;
  loads: EligibleLoadPreview[];
  recurringFees: RecurringFee[];
  defaultPeriodStart?: string;
  defaultPeriodEnd?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(
    () => new Set(loads.map((l) => l.id)),
  );
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(recurringFees.map((f) => [f.id, String(f.amount)])),
  );

  const loadsSubtotal = useMemo(
    () =>
      loads
        .filter((l) => selectedLoads.has(l.id))
        .reduce((s, l) => s + l.truckerPayout, 0),
    [loads, selectedLoads],
  );
  const recurringTotal = useMemo(
    () =>
      Array.from(selectedFees).reduce((s, id) => {
        const v = Number(feeAmounts[id]);
        return s + (Number.isFinite(v) ? v : 0);
      }, 0),
    [selectedFees, feeAmounts],
  );
  const net = +(loadsSubtotal - recurringTotal).toFixed(2);

  function toggleLoad(id: string) {
    setSelectedLoads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFee(id: string) {
    setSelectedFees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllLoads() {
    setSelectedLoads(new Set(loads.map((l) => l.id)));
  }
  function clearAllLoads() {
    setSelectedLoads(new Set());
  }

  function submit(fd: FormData) {
    if (selectedLoads.size === 0 && selectedFees.size === 0) {
      setError('Select at least one load or recurring fee.');
      return;
    }
    setError(null);
    for (const id of selectedLoads) fd.append('loadIds', id);
    for (const id of selectedFees) fd.append('recurringIds', id);
    startTransition(async () => {
      try {
        await createPayout(truckerId, fd);
      } catch (e) {
        if (
          e instanceof Error &&
          'digest' in e &&
          typeof (e as { digest?: unknown }).digest === 'string' &&
          (e as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
          throw e;
        }
        setError(e instanceof Error ? e.message : 'Could not create payout.');
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Loads ({selectedLoads.size} of {loads.length})
          </h2>
          {loads.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllLoads}
                className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAllLoads}
                className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {loads.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No eligible loads. Loads must be assigned to {truckerName}, not cancelled, and not
            already on another payout.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {loads.map((l) => {
              const checked = selectedLoads.has(l.id);
              return (
                <li key={l.id} className="py-2">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLoad(l.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <div className="grid flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div>
                        <div className="font-medium">{l.ref}</div>
                        <div className="text-xs text-slate-400">{l.id}</div>
                      </div>
                      <div className="text-xs text-slate-600">
                        <div className="uppercase tracking-wide text-slate-400">Route</div>
                        <div className="truncate">
                          {l.originCompany || '—'} → {l.destinationCompany || '—'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600">
                        <div className="uppercase tracking-wide text-slate-400">Pickup</div>
                        <div>{l.pickupDate || '—'}</div>
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        <div className="font-medium">{money.format(l.truckerPayout)}</div>
                        <div className="text-xs text-slate-400">
                          base {money.format(l.base)} − fees {money.format(l.feesTotal)}
                        </div>
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {recurringFees.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recurring deductions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Optional. Add any recurring fees (insurance, plate, etc.) that apply to this payout
            period.
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {recurringFees.map((f) => {
              const checked = selectedFees.has(f.id);
              const suffix = f.type === 'percent' ? '%' : '$';
              return (
                <li key={f.id} className="py-2">
                  <div className="flex items-center gap-3">
                    <input
                      id={`fee-${f.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFee(f.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor={`fee-${f.id}`} className="flex-1 text-sm">
                      <span className="font-medium">{f.name}</span>{' '}
                      <span className="text-xs text-slate-500">
                        ({f.frequency}, default {suffix === '$' ? money.format(f.amount) : `${f.amount}%`})
                      </span>
                    </label>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        name={`recurringAmount_${f.id}`}
                        disabled={!checked}
                        value={feeAmounts[f.id] ?? ''}
                        onChange={(e) =>
                          setFeeAmounts((prev) => ({ ...prev, [f.id]: e.target.value }))
                        }
                        className={`${inputCx} text-right`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <Field
          label="Period start"
          hint={defaultPeriodStart ? 'Day after the last payout period.' : 'Optional.'}
        >
          <input
            type="date"
            name="periodStart"
            defaultValue={defaultPeriodStart}
            className={inputCx}
          />
        </Field>
        <Field label="Period end" hint={defaultPeriodEnd ? 'Defaults to today.' : 'Optional.'}>
          <input
            type="date"
            name="periodEnd"
            defaultValue={defaultPeriodEnd}
            className={inputCx}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea name="notes" rows={2} className={inputCx} />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white px-4 py-3 shadow-md md:mx-0 md:rounded-lg md:border md:shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Net payable</div>
            <div className="text-2xl font-semibold tabular-nums">{money.format(net)}</div>
            <div className="text-xs text-slate-500 tabular-nums">
              loads {money.format(loadsSubtotal)} − deductions {money.format(recurringTotal)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/truckers/${truckerId}?tab=payouts`)}
              className={btnSecondary}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={pending}>
              {pending ? 'Creating…' : 'Create payout'}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      <p className="text-xs text-slate-500">
        Creating this payout will mark the selected loads as paid and link them to this payout.
        You can void the payout later to unlink them.{' '}
        <Link
          href={`/truckers/${truckerId}?tab=payouts`}
          className="font-medium underline hover:text-slate-700"
        >
          Past payouts
        </Link>
      </p>
    </form>
  );
}
