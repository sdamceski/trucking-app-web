'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setInvoiced, clearInvoiced } from '@/lib/actions/loads';
import { Load } from '@/lib/types';
import { btnPrimary, btnSecondary, btnDanger, inputCx } from './form';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoicedDialog({ load }: { load: Load }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(load.invoicedAt || todayISO());
  const [note, setNote] = useState(load.invoicedNote || '');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(load.invoicedAt || todayISO());
    setNote(load.invoicedNote || '');
  }, [open, load.invoicedAt, load.invoicedNote]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function save() {
    if (!date) return;
    startTransition(async () => {
      await setInvoiced(load.id, date, note);
      setOpen(false);
      router.refresh();
    });
  }

  function clear() {
    startTransition(async () => {
      await clearInvoiced(load.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {load.invoiced ? (
        <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>
          Edit invoice
        </button>
      ) : (
        <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
          Mark invoiced
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoiced-dialog-title"
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          >
            <h3
              id="invoiced-dialog-title"
              className="text-base font-semibold text-slate-900"
            >
              {load.invoiced ? 'Edit invoice details' : 'Mark load as invoiced'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record when the customer was invoiced and any reference info.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs">
                <span className="block font-medium uppercase tracking-wide text-slate-500">
                  Invoice date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputCx} mt-1`}
                  autoFocus
                />
              </label>
              <label className="block text-xs">
                <span className="block font-medium uppercase tracking-wide text-slate-500">
                  Note (optional)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Invoice #, customer reference, etc."
                  className={`${inputCx} mt-1`}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              {load.invoiced && (
                <button
                  type="button"
                  onClick={clear}
                  disabled={pending}
                  className={`${btnDanger} mr-auto`}
                >
                  Unmark invoiced
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending || !date}
                className={btnPrimary}
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
