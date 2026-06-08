'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLoad } from '@/lib/actions/loads';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import AddressAutocomplete from './AddressAutocomplete';
import LoadPricingFields from './LoadPricingFields';
import { Load, Trucker } from '@/lib/types';

export default function LoadEditForm({
  load,
  truckers,
}: {
  load: Load;
  truckers: Trucker[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateLoad(load.id, fd);
        setSavedAt(Date.now());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pickup date">
          <input
            name="pickupDate"
            type="date"
            required
            defaultValue={load.pickupDate}
            className={inputCx}
          />
        </Field>
        <Field label="Delivery date">
          <input
            name="deliveryDate"
            type="date"
            defaultValue={load.deliveryDate}
            className={inputCx}
          />
        </Field>
      </div>

      <Field label="Trucker">
        <select name="truckerId" defaultValue={load.truckerId} className={inputCx}>
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
          <input
            name="originCompany"
            type="text"
            defaultValue={load.originCompany}
            className={inputCx}
          />
        </Field>
        <Field label="Origin address">
          <AddressAutocomplete name="originAddress" defaultValue={load.originAddress} />
        </Field>
        <Field label="Destination company">
          <input
            name="destinationCompany"
            type="text"
            defaultValue={load.destinationCompany}
            className={inputCx}
          />
        </Field>
        <Field label="Destination address">
          <AddressAutocomplete name="destinationAddress" defaultValue={load.destinationAddress} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LoadPricingFields
          defaultLoadPrice={load.loadPrice}
          defaultTruckerRate={load.truckerRate}
        />
        <Field label="Reference">
          <input name="reference" type="text" defaultValue={load.reference} className={inputCx} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea name="notes" rows={3} defaultValue={load.notes} className={inputCx} />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {error && <span className="text-rose-600">{error}</span>}
          {!error && savedAt && <span>Saved</span>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => router.refresh()}
            className={btnSecondary}
          >
            Revert
          </button>
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}
