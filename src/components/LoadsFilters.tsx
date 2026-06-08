'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { LOAD_STATUSES } from '@/lib/types';
import { Trucker } from '@/lib/types';
import { inputCx, btnSecondary } from './form';

type TriValue = 'no' | 'yes' | 'any';

export default function LoadsFilters({
  truckers,
  activeCount,
  basePath = '/loads',
  hideTrucker = false,
  preserveParams = [],
}: {
  truckers: Trucker[];
  activeCount: number;
  basePath?: string;
  hideTrucker?: boolean;
  preserveParams?: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = {
    status: sp.get('status') ?? '',
    trucker: sp.get('trucker') ?? '',
    invoiced: (sp.get('invoiced') ?? 'no') as TriValue,
    paid: (sp.get('paid') ?? 'no') as TriValue,
    from: sp.get('from') ?? '',
    to: sp.get('to') ?? '',
    q: sp.get('q') ?? '',
  };

  // Local state for the toggle pills; re-sync when the URL changes or panel opens.
  const [uiInvoiced, setUiInvoiced] = useState<TriValue>(current.invoiced);
  const [uiPaid, setUiPaid] = useState<TriValue>(current.paid);
  useEffect(() => {
    setUiInvoiced(current.invoiced);
    setUiPaid(current.paid);
  }, [current.invoiced, current.paid]);

  // Defaults (invoiced=no, paid=no) don't count toward the badge.
  const advancedActive = (
    hideTrucker
      ? (['status', 'from', 'to', 'q'] as const)
      : (['status', 'trucker', 'from', 'to', 'q'] as const)
  )
    .map((k) => current[k])
    .filter(Boolean).length;
  const toggleActive =
    (current.invoiced !== 'no' ? 1 : 0) + (current.paid !== 'no' ? 1 : 0);
  const active = advancedActive + toggleActive;

  function apply(fd: FormData) {
    const next = new URLSearchParams();
    for (const key of preserveParams) {
      const v = sp.get(key);
      if (v) next.set(key, v);
    }
    const baseKeys = hideTrucker
      ? (['status', 'from', 'to', 'q'] as const)
      : (['status', 'trucker', 'from', 'to', 'q'] as const);
    for (const key of baseKeys) {
      const v = fd.get(key);
      if (typeof v === 'string' && v.trim()) next.set(key, v.trim());
    }
    if (uiInvoiced !== 'no') next.set('invoiced', uiInvoiced);
    if (uiPaid !== 'no') next.set('paid', uiPaid);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
      setOpen(false);
    });
  }

  function clearAll() {
    setUiInvoiced('no');
    setUiPaid('no');
    startTransition(() => {
      const next = new URLSearchParams();
      for (const key of preserveParams) {
        const v = sp.get(key);
        if (v) next.set(key, v);
      }
      const qs = next.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
      setOpen(false);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          Filters
          {active > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-medium text-white">
              {active}
            </span>
          )}
        </button>
        <span className="ml-auto text-xs text-slate-500">{activeCount} matching</span>
        {active > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {open && (
        <form
          action={apply}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="flex flex-wrap gap-3">
            <Segmented
              label="Invoiced"
              value={uiInvoiced}
              onChange={setUiInvoiced}
              options={[
                { value: 'no', label: 'Open' },
                { value: 'yes', label: 'Invoiced' },
                { value: 'any', label: 'All' },
              ]}
              activeAccent="sky"
            />
            <Segmented
              label="Paid"
              value={uiPaid}
              onChange={setUiPaid}
              options={[
                { value: 'no', label: 'Unpaid' },
                { value: 'yes', label: 'Paid' },
                { value: 'any', label: 'All' },
              ]}
              activeAccent="emerald"
            />
          </div>

          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
              hideTrucker ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
            }`}
          >
            <label className="text-xs">
              <span className="block font-medium uppercase tracking-wide text-slate-500">Status</span>
              <select name="status" defaultValue={current.status} className={`${inputCx} mt-1`}>
                <option value="">Any</option>
                {LOAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {!hideTrucker && (
              <label className="text-xs">
                <span className="block font-medium uppercase tracking-wide text-slate-500">Trucker</span>
                <select name="trucker" defaultValue={current.trucker} className={`${inputCx} mt-1`}>
                  <option value="">Any</option>
                  <option value="__none">— unassigned —</option>
                  {truckers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-xs">
              <span className="block font-medium uppercase tracking-wide text-slate-500">From</span>
              <input
                type="date"
                name="from"
                defaultValue={current.from}
                className={`${inputCx} mt-1`}
              />
            </label>
            <label className="text-xs">
              <span className="block font-medium uppercase tracking-wide text-slate-500">To</span>
              <input
                type="date"
                name="to"
                defaultValue={current.to}
                className={`${inputCx} mt-1`}
              />
            </label>
            <label className="text-xs">
              <span className="block font-medium uppercase tracking-wide text-slate-500">Search</span>
              <input
                type="search"
                name="q"
                defaultValue={current.q}
                placeholder="Ref, ID, origin…"
                className={`${inputCx} mt-1`}
              />
            </label>
          </div>

          <div className="flex items-end justify-end gap-2">
            <button type="button" onClick={clearAll} disabled={pending} className={btnSecondary}>
              Clear all
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
  activeAccent,
}: {
  label: string;
  value: TriValue;
  options: { value: TriValue; label: string }[];
  onChange: (v: TriValue) => void;
  activeAccent: 'sky' | 'emerald';
}) {
  const accentCx =
    activeAccent === 'sky'
      ? 'bg-sky-600 text-white'
      : 'bg-emerald-600 text-white';
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {options.map((opt, i) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                'px-2.5 py-1 text-xs font-medium transition ' +
                (active ? accentCx : 'text-slate-600 hover:bg-slate-50') +
                (i > 0 ? ' border-l border-slate-300' : '')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
