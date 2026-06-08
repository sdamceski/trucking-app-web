import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoads, getTrucker } from '@/lib/store';
import {
  DeleteTruckerButton,
  PerLoadFees,
  RecurringFees,
  TruckerProfileForm,
} from '@/components/TruckerDetailParts';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function TruckerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trucker, loads] = await Promise.all([getTrucker(id), getLoads()]);
  if (!trucker) notFound();

  const myLoads = loads.filter((l) => l.truckerId === trucker.id);
  const activeLoads = myLoads.filter((l) => !l.cancelled);
  const totalRate = activeLoads.reduce((s, l) => s + (l.truckerRate || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/truckers"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All truckers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{trucker.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {trucker.id}
              {trucker.truckNumber ? ` · Truck ${trucker.truckNumber}` : ''}
            </p>
          </div>
          <DeleteTruckerButton id={trucker.id} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Loads" value={myLoads.length.toString()} />
        <Stat label="Active" value={activeLoads.length.toString()} />
        <Stat label="Total rates" value={money.format(totalRate)} />
      </div>

      {/* Profile */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Profile
        </h2>
        <TruckerProfileForm trucker={trucker} />
      </section>

      {/* Per-load fees */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Per-load fees
          </h2>
          <p className="text-xs text-slate-500">
            Deducted from the trucker rate on every load assigned to this trucker. Snapshotted at
            assignment time, so existing loads aren&apos;t affected by edits here.
          </p>
        </div>
        <PerLoadFees trucker={trucker} />
      </section>

      {/* Recurring fees */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recurring fees
          </h2>
          <p className="text-xs text-slate-500">
            Charged on a schedule and prorated onto pay slips (phase 3).
          </p>
        </div>
        <RecurringFees trucker={trucker} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
