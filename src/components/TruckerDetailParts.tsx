'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addPerLoadFee,
  addRecurringFee,
  deleteTrucker,
  removePerLoadFee,
  removeRecurringFee,
  updateTruckerProfile,
} from '@/lib/actions/truckers';
import { Field, btnPrimary, btnSecondary, btnDanger, inputCx } from './form';
import { PerLoadFee, RECURRING_FREQUENCIES, RecurringFee, Trucker } from '@/lib/types';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function feeAmountLabel(fee: PerLoadFee) {
  return fee.type === 'percent' ? `${fee.amount}%` : money.format(fee.amount);
}

export function TruckerProfileForm({ trucker }: { trucker: Trucker }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateTruckerProfile(trucker.id, fd);
        setSavedAt(Date.now());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Name">
        <input
          name="name"
          type="text"
          required
          defaultValue={trucker.name}
          className={inputCx}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input name="phone" type="tel" defaultValue={trucker.phone} className={inputCx} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={trucker.email} className={inputCx} />
        </Field>
        <Field label="Truck #">
          <input
            name="truckNumber"
            type="text"
            defaultValue={trucker.truckNumber}
            className={inputCx}
          />
        </Field>
        <Field label="Commission %" hint="0–100">
          <input
            name="commissionPercent"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={trucker.commissionPercent}
            className={inputCx}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="notes" rows={2} defaultValue={trucker.notes} className={inputCx} />
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

export function PerLoadFees({ trucker }: { trucker: Trucker }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function add(fd: FormData) {
    startTransition(async () => {
      await addPerLoadFee(trucker.id, fd);
      router.refresh();
      // Reset form fields
      const form = document.getElementById('per-load-fee-form') as HTMLFormElement | null;
      form?.reset();
    });
  }

  function remove(feeId: string) {
    startTransition(async () => {
      await removePerLoadFee(trucker.id, feeId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {trucker.perLoadFees.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {trucker.perLoadFees.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-500">
                  {f.type === 'percent' ? 'Percent of base' : 'Fixed amount'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{feeAmountLabel(f)}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(f.id)}
                  className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No per-load fees configured.</p>
      )}

      <form
        id="per-load-fee-form"
        action={add}
        className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-300 p-3 sm:grid-cols-[1fr_120px_120px_auto]"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="Fee name"
          className={inputCx}
        />
        <select name="type" defaultValue="fixed" className={inputCx}>
          <option value="fixed">Fixed $</option>
          <option value="percent">Percent %</option>
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min={0}
          required
          placeholder="Amount"
          className={inputCx}
        />
        <button type="submit" disabled={pending} className={btnPrimary}>
          Add fee
        </button>
      </form>
    </div>
  );
}

export function RecurringFees({ trucker }: { trucker: Trucker }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function add(fd: FormData) {
    startTransition(async () => {
      await addRecurringFee(trucker.id, fd);
      router.refresh();
      const form = document.getElementById('recurring-fee-form') as HTMLFormElement | null;
      form?.reset();
    });
  }

  function remove(feeId: string) {
    startTransition(async () => {
      await removeRecurringFee(trucker.id, feeId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {trucker.recurringFees.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {trucker.recurringFees.map((f: RecurringFee) => (
            <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-500">
                  {f.type === 'percent' ? 'Percent' : 'Fixed'} · {f.frequency}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{feeAmountLabel(f)}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(f.id)}
                  className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No recurring fees configured.</p>
      )}

      <form
        id="recurring-fee-form"
        action={add}
        className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-300 p-3 sm:grid-cols-[1fr_110px_110px_140px_auto]"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="Fee name"
          className={inputCx}
        />
        <select name="type" defaultValue="fixed" className={inputCx}>
          <option value="fixed">Fixed $</option>
          <option value="percent">Percent %</option>
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min={0}
          required
          placeholder="Amount"
          className={inputCx}
        />
        <select name="frequency" defaultValue="monthly" className={inputCx}>
          {RECURRING_FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className={btnPrimary}>
          Add fee
        </button>
      </form>
    </div>
  );
}

export function DeleteTruckerButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this trucker? Loads assigned to them will be unassigned.')) return;
        startTransition(async () => {
          await deleteTrucker(id);
        });
      }}
      className={btnDanger}
    >
      {pending ? 'Deleting…' : 'Delete trucker'}
    </button>
  );
}
