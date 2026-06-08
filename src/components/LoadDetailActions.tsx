'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setLoadStatus, toggleFlag, deleteLoad } from '@/lib/actions/loads';
import { Load, LoadStatus } from '@/lib/types';
import { btnPrimary, btnSecondary, btnDanger } from './form';

const STATUS_LABEL: Record<LoadStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  delivered: 'Delivered',
};

const NEXT_STATUS: Record<LoadStatus, { to: LoadStatus; label: string } | null> = {
  new: null,
  assigned: { to: 'picked_up', label: 'Mark picked up' },
  picked_up: { to: 'delivered', label: 'Mark delivered' },
  delivered: null,
};

export function StatusActions({ load }: { load: Load }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[load.status];
  if (!next) {
    return load.status === 'new' && !load.truckerId ? (
      <p className="text-sm text-slate-500">
        Assign a trucker below — status will auto-advance to <strong>Assigned</strong>.
      </p>
    ) : (
      <p className="text-sm text-slate-500">No further status transitions.</p>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLoadStatus(load.id, next.to);
          router.refresh();
        })
      }
      className={btnPrimary}
    >
      {pending ? 'Saving…' : next.label}
    </button>
  );
}

export function FlagActions({ load }: { load: Load }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  function toggle(flag: 'invoiced' | 'paid', value: boolean) {
    startTransition(async () => {
      await toggleFlag(load.id, flag, value);
      router.refresh();
    });
  }

  function cancel() {
    if (load.cancelled) {
      startTransition(async () => {
        await toggleFlag(load.id, 'cancelled', false);
        router.refresh();
      });
      return;
    }
    if (!showReason) {
      setShowReason(true);
      return;
    }
    if (!reason.trim()) return;
    startTransition(async () => {
      await toggleFlag(load.id, 'cancelled', true, reason);
      setReason('');
      setShowReason(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => toggle('invoiced', !load.invoiced)}
          className={load.invoiced ? btnSecondary : btnPrimary}
        >
          {load.invoiced ? 'Unmark invoiced' : 'Mark invoiced'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => toggle('paid', !load.paid)}
          className={load.paid ? btnSecondary : btnPrimary}
        >
          {load.paid ? 'Unmark paid' : 'Mark paid'}
        </button>
        <button type="button" disabled={pending} onClick={cancel} className={btnDanger}>
          {load.cancelled ? 'Reopen load' : showReason ? 'Confirm cancel' : 'Cancel load'}
        </button>
      </div>
      {showReason && !load.cancelled && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Reason for cancellation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-md border border-rose-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowReason(false);
              setReason('');
            }}
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
          >
            Discard
          </button>
        </div>
      )}
      {load.cancelled && load.cancellationReason && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <span className="font-medium">Cancelled:</span> {load.cancellationReason}
        </p>
      )}
      {/* Status badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${
            load.invoiced
              ? 'bg-sky-50 text-sky-700 ring-sky-200'
              : 'bg-slate-50 text-slate-400 ring-slate-200'
          }`}
        >
          {load.invoiced ? '✓ Invoiced' : 'Not invoiced'}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${
            load.paid
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-slate-50 text-slate-400 ring-slate-200'
          }`}
        >
          {load.paid ? '✓ Paid' : 'Not paid'}
        </span>
        {load.cancelled && (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
            ✗ Cancelled
          </span>
        )}
      </div>
    </div>
  );
}

export function DeleteLoadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this load? This cannot be undone.')) return;
        startTransition(async () => {
          await deleteLoad(id);
        });
      }}
      className={btnDanger}
    >
      {pending ? 'Deleting…' : 'Delete load'}
    </button>
  );
}

export { STATUS_LABEL };
