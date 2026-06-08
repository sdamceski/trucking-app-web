'use client';

import { useTransition } from 'react';
import { setMyLoadStatus } from '@/lib/actions/loads';
import type { LoadStatus } from '@/lib/types';

const STATUS_LABEL: Record<LoadStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  delivered: 'Delivered',
};

const STATUS_PILL: Record<LoadStatus, string> = {
  new: 'bg-slate-100 text-slate-700 ring-slate-200',
  assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  picked_up: 'bg-amber-50 text-amber-800 ring-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

type MyLoad = {
  id: string;
  status: LoadStatus;
  pickupDate: string;
  deliveryDate: string;
  originCompany: string;
  originAddress: string;
  destinationCompany: string;
  destinationAddress: string;
  reference: string;
  notes: string;
  paid: boolean;
};

export default function MyLoadsList({
  loads,
  emptyMessage = 'No loads assigned to you yet.',
}: {
  loads: MyLoad[];
  emptyMessage?: string;
}) {
  if (loads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {loads.map((l) => (
        <LoadCard key={l.id} load={l} />
      ))}
    </ul>
  );
}

function LoadCard({ load }: { load: MyLoad }) {
  const [pending, start] = useTransition();

  function update(status: LoadStatus) {
    start(() => {
      setMyLoadStatus(load.id, status).catch((e: unknown) => {
        if (typeof window !== 'undefined') alert((e as Error).message);
      });
    });
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{load.reference || load.id}</div>
          <div className="mt-0.5 text-xs text-slate-500">{load.id}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={
              'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
              STATUS_PILL[load.status]
            }
          >
            {STATUS_LABEL[load.status]}
          </span>
          {load.paid ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              Paid
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Pickup</div>
          <div className="font-medium">{load.originCompany || '—'}</div>
          <div className="text-slate-500">{load.originAddress || '—'}</div>
          <div className="mt-0.5 text-xs text-slate-500">{load.pickupDate || '—'}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Drop off</div>
          <div className="font-medium">{load.destinationCompany || '—'}</div>
          <div className="text-slate-500">{load.destinationAddress || '—'}</div>
          <div className="mt-0.5 text-xs text-slate-500">{load.deliveryDate || '—'}</div>
        </div>
      </div>

      {load.notes ? (
        <div className="mt-3 rounded-md bg-slate-50 p-2.5 text-sm text-slate-700">
          {load.notes}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {load.status === 'assigned' || load.status === 'new' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => update('picked_up')}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
          >
            Mark picked up
          </button>
        ) : null}
        {load.status === 'picked_up' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => update('delivered')}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            Mark delivered
          </button>
        ) : null}
        {load.status === 'delivered' ? (
          <span className="text-sm text-emerald-700">✓ Delivered</span>
        ) : null}
      </div>
    </li>
  );
}
