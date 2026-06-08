'use client';

import { useState, useTransition } from 'react';
import Sheet from './Sheet';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import { createLoad } from '@/lib/actions/loads';
import type { Trucker } from '@/lib/types';

export default function NewLoadButton({ truckers }: { truckers: Trucker[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createLoad(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create load');
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
        + New load
      </button>
      <Sheet
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="New load"
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
            <button type="submit" form="new-load-form" disabled={pending} className={btnPrimary}>
              {pending ? 'Creating…' : 'Create load'}
            </button>
          </div>
        }
      >
        <form id="new-load-form" action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pickup date">
              <input name="pickupDate" type="date" required className={inputCx} />
            </Field>
            <Field label="Delivery date">
              <input name="deliveryDate" type="date" className={inputCx} />
            </Field>
          </div>

          <Field label="Trucker">
            <select name="truckerId" className={inputCx} defaultValue="">
              <option value="">— unassigned —</option>
              {truckers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.truckNumber ? ` · Truck ${t.truckNumber}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Origin company">
              <input name="originCompany" type="text" className={inputCx} />
            </Field>
            <Field label="Origin address">
              <input name="originAddress" type="text" className={inputCx} />
            </Field>
            <Field label="Destination company">
              <input name="destinationCompany" type="text" className={inputCx} />
            </Field>
            <Field label="Destination address">
              <input name="destinationAddress" type="text" className={inputCx} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Load price ($)">
              <input
                name="loadPrice"
                type="number"
                step="0.01"
                min={0}
                defaultValue={0}
                className={inputCx}
              />
            </Field>
            <Field label="Trucker rate ($)">
              <input
                name="truckerRate"
                type="number"
                step="0.01"
                min={0}
                defaultValue={0}
                className={inputCx}
              />
            </Field>
            <Field label="Reference">
              <input name="reference" type="text" className={inputCx} />
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
