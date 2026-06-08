'use client';

import { useState, useTransition } from 'react';
import Sheet from './Sheet';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import { createTrucker } from '@/lib/actions/truckers';

export default function NewTruckerButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createTrucker(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create trucker');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      >
        + New trucker
      </button>
      <Sheet
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="New trucker"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" form="new-trucker-form" disabled={pending} className={btnPrimary}>
              {pending ? 'Creating…' : 'Create trucker'}
            </button>
          </div>
        }
      >
        <form id="new-trucker-form" action={onSubmit} className="space-y-4">
          <Field label="Name">
            <input name="name" type="text" required className={inputCx} autoFocus />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input name="phone" type="tel" className={inputCx} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" className={inputCx} />
            </Field>
            <Field label="Truck #">
              <input name="truckNumber" type="text" className={inputCx} />
            </Field>
            <Field label="Commission %" hint="0–100">
              <input
                name="commissionPercent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={0}
                className={inputCx}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea name="notes" rows={2} className={inputCx} />
          </Field>
          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </form>
      </Sheet>
    </>
  );
}
