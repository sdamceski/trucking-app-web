import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/dal';
import { getPayout } from '@/lib/store';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export default async function MyPayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'trucker' || !user.truckerId) redirect('/login');

  const { id } = await params;
  const payout = await getPayout(id);
  if (!payout || payout.truckerId !== user.truckerId) notFound();

  const period =
    payout.periodStart || payout.periodEnd
      ? `${payout.periodStart || '—'} → ${payout.periodEnd || '—'}`
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/my/payouts"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All payouts
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payout {payout.id}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Created {dt.format(new Date(payout.createdAt))}
          {period ? ` · ${period}` : ''}
        </p>
      </div>

      {/* Net hero */}
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">Net paid</div>
            <div className="text-xs text-emerald-700/80">
              {payout.loadLines.length} load{payout.loadLines.length === 1 ? '' : 's'}
              {payout.recurringLines.length > 0
                ? ` · ${payout.recurringLines.length} deduction${
                    payout.recurringLines.length === 1 ? '' : 's'
                  }`
                : ''}
            </div>
          </div>
          <div className="text-3xl font-semibold tabular-nums text-emerald-800">
            {money.format(payout.netTotal)}
          </div>
        </div>
      </section>

      {/* Loads */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Loads ({payout.loadLines.length})
        </h2>
        {payout.loadLines.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No loads on this payout.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {payout.loadLines.map((l) => (
              <li key={l.loadId} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{l.loadRef || l.loadId}</div>
                    <div className="text-xs text-slate-400">{l.loadId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Pay
                    </div>
                    <div className="text-base font-semibold tabular-nums text-slate-900">
                      {money.format(l.truckerPayout)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <div>
                    <div className="uppercase tracking-wide text-slate-400">Rate</div>
                    <div className="tabular-nums">{money.format(l.base)}</div>
                  </div>
                  {l.commissionAmount > 0 ? (
                    <div>
                      <div className="uppercase tracking-wide text-slate-400">
                        Commission ({l.commissionPercent}%)
                      </div>
                      <div className="tabular-nums">
                        −{money.format(l.commissionAmount)}
                      </div>
                    </div>
                  ) : null}
                  {l.feesTotal > 0 ? (
                    <div>
                      <div className="uppercase tracking-wide text-slate-400">Fees</div>
                      <div className="tabular-nums">−{money.format(l.feesTotal)}</div>
                    </div>
                  ) : null}
                </div>

                {l.feeBreakdown.filter((f) => f.source === 'perLoadFee').length > 0 ? (
                  <ul className="mt-2 space-y-0.5 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                    {l.feeBreakdown
                      .filter((f) => f.source === 'perLoadFee')
                      .map((f, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>{f.name}</span>
                          <span className="tabular-nums">−{money.format(f.amount)}</span>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-medium">
          <span>Loads subtotal</span>
          <span className="tabular-nums">{money.format(payout.loadsSubtotal)}</span>
        </div>
      </section>

      {/* Recurring deductions */}
      {payout.recurringLines.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Deductions
          </h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {payout.recurringLines.map((l) => (
              <li key={l.feeId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-slate-500">{l.frequency}</div>
                </div>
                <div className="text-sm tabular-nums text-slate-900">
                  −{money.format(l.amount)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-medium">
            <span>Deductions subtotal</span>
            <span className="tabular-nums">−{money.format(payout.recurringTotal)}</span>
          </div>
        </section>
      )}

      {payout.notes && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{payout.notes}</p>
        </section>
      )}
    </div>
  );
}
