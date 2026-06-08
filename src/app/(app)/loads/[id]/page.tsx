import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoad, getTruckers } from '@/lib/store';
import { computeLoadFinancials } from '@/lib/financials';
import { LoadStatus } from '@/lib/types';
import LoadEditForm from '@/components/LoadEditForm';
import LoadDocuments from '@/components/LoadDocuments';
import {
  STATUS_LABEL,
  StatusActions,
  FlagActions,
  DeleteLoadButton,
} from '@/components/LoadDetailActions';

const STATUS_PILL: Record<LoadStatus, string> = {
  new: 'bg-slate-100 text-slate-700 ring-slate-200',
  assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  picked_up: 'bg-amber-50 text-amber-800 ring-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [load, truckers] = await Promise.all([getLoad(id), getTruckers()]);
  if (!load) notFound();

  const trucker = load.truckerId ? truckers.find((t) => t.id === load.truckerId) : undefined;
  const fin = computeLoadFinancials(load, trucker);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/loads"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All loads
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {load.reference || load.id}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{load.id}</span>
              <span
                className={
                  'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
                  STATUS_PILL[load.status]
                }
              >
                {STATUS_LABEL[load.status]}
              </span>
            </div>
          </div>
          <DeleteLoadButton id={load.id} />
        </div>
      </div>

      {/* Status + Flags */}
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Workflow
          </h2>
          <div className="mt-2">
            <StatusActions load={load} />
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Billing flags
          </h2>
          <div className="mt-2">
            <FlagActions load={load} />
          </div>
          {load.payoutId && (
            <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Settled on payout{' '}
              <Link href={`/payouts/${load.payoutId}`} className="font-medium underline">
                {load.payoutId}
              </Link>
              . Void the payout to mark this load unpaid again.
            </p>
          )}
          {load.invoiced && (
            <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
              <span className="font-medium">Invoiced</span>
              {load.invoicedAt && (
                <>
                  {' '}on{' '}
                  <span className="font-medium">
                    {new Date(load.invoicedAt).toLocaleDateString()}
                  </span>
                </>
              )}
              {load.invoicedNote && (
                <>
                  {' — '}
                  <span className="italic">{load.invoicedNote}</span>
                </>
              )}
            </p>
          )}
        </div>
      </section>

      {/* Payout breakdown */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Payout
          </h2>
          {load.payoutSnapshot ? (
            <span className="text-xs text-slate-400">
              Snapshot captured {new Date(load.payoutSnapshot.capturedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No snapshot (no trucker)</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Base (trucker rate)" value={money.format(fin.base)} />
          <Stat label="Fees + commission" value={money.format(fin.feesTotal)} />
          <Stat label="Trucker payout" value={money.format(fin.truckerPayout)} accent="emerald" />
          <Stat label="Company margin" value={money.format(fin.companyMargin)} accent="slate" />
        </div>
        {fin.feeBreakdown.length > 0 && (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Line</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fin.feeBreakdown.map((line, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{line.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money.format(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit form */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Details
        </h2>
        <LoadEditForm load={load} truckers={truckers} />
      </section>

      {/* Documents */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Documents
        </h2>
        <LoadDocuments loadId={load.id} documents={load.documents} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'emerald' | 'slate';
}) {
  const accentCx =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'slate'
        ? 'text-slate-900'
        : 'text-slate-900';
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-base font-semibold tabular-nums ${accentCx}`}>{value}</div>
    </div>
  );
}
