'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { LOAD_STATUSES } from '@/lib/types';
import { Trucker } from '@/lib/types';
import { inputCx, btnSecondary } from './form';

export default function LoadsFilters({
  truckers,
  activeCount,
}: {
  truckers: Trucker[];
  activeCount: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = {
    status: sp.get('status') ?? '',
    trucker: sp.get('trucker') ?? '',
    from: sp.get('from') ?? '',
    to: sp.get('to') ?? '',
    q: sp.get('q') ?? '',
  };
  const active = Object.values(current).filter(Boolean).length;

  function apply(fd: FormData) {
    const next = new URLSearchParams();
    for (const key of ['status', 'trucker', 'from', 'to', 'q'] as const) {
      const v = fd.get(key);
      if (typeof v === 'string' && v.trim()) next.set(key, v.trim());
    }
    startTransition(() => {
      router.push(`/loads${next.toString() ? `?${next}` : ''}`);
      setOpen(false);
    });
  }

  function clear() {
    startTransition(() => {
      router.push('/loads');
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
        {active > 0 && (
          <>
            <span className="text-xs text-slate-500">
              {activeCount} matching
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {open && (
        <form
          action={apply}
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-5"
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
          <div className="flex items-end justify-end gap-2 sm:col-span-5">
            <button type="button" onClick={clear} disabled={pending} className={btnSecondary}>
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
