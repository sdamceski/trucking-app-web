import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPayout } from '@/lib/store';
import VoidPayoutButton from '@/components/VoidPayoutButton';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export default async function PayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payout = await getPayout(id);
  if (!payout) notFound();

  const period =
    payout.periodStart || payout.periodEnd
      ? `${payout.periodStart || '—'} → ${payout.periodEnd || '—'}`
      : null;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="space-y-2 print:hidden">
        <Link
          href={`/truckers/${payout.truckerId}?tab=payouts`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to {payout.truckerName}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payout {payout.id}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {payout.truckerName} · created {dt.format(new Date(payout.createdAt))}
            {period ? ` · ${period}` : ''}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <VoidPayoutButton payoutId={payout.id} truckerId={payout.truckerId} />
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Loads subtotal" value={money.format(payout.loadsSubtotal)} />
        <Stat label="Deductions" value={money.format(payout.recurringTotal)} />
        <Stat label="Net payable" value={money.format(payout.netTotal)} accent />
      </div>

      {/* Load lines */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Loads ({payout.loadLines.length})
        </h2>
        {payout.loadLines.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No loads on this payout.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Ref</th>
                  <th className="px-2 py-2 text-right font-medium">Base</th>
                  <th className="px-2 py-2 text-left font-medium">Deductions</th>
                  <th className="px-2 py-2 text-right font-medium">Fees total</th>
                  <th className="px-2 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payout.loadLines.map((l) => (
                  <tr key={l.loadId}>
                    <td className="px-2 py-2 align-top">
                      <Link
                        href={`/loads/${l.loadId}`}
                        className="font-medium text-slate-800 hover:underline print:no-underline"
                      >
                        {l.loadRef}
                      </Link>
                      <div className="text-xs text-slate-400">{l.loadId}</div>
                    </td>
                    <td className="px-2 py-2 text-right align-top tabular-nums">
                      {money.format(l.base)}
                    </td>
                    <td className="px-2 py-2 align-top text-xs text-slate-600">
                      {l.feeBreakdown.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {l.feeBreakdown.map((f, i) => (
                            <li key={i} className="flex justify-between gap-3">
                              <span>{f.name}</span>
                              <span className="tabular-nums">{money.format(f.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right align-top tabular-nums">
                      {money.format(l.feesTotal)}
                    </td>
                    <td className="px-2 py-2 text-right align-top font-medium tabular-nums">
                      {money.format(l.truckerPayout)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 text-sm font-medium">
                  <td className="px-2 py-2" colSpan={4}>
                    Loads subtotal
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {money.format(payout.loadsSubtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Recurring deductions */}
      {payout.recurringLines.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recurring deductions
          </h2>
          <table className="mt-3 min-w-full divide-y divide-slate-200 text-sm">
            <tbody className="divide-y divide-slate-100">
              {payout.recurringLines.map((l) => (
                <tr key={l.feeId}>
                  <td className="px-2 py-2">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-slate-500">{l.frequency}</div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{money.format(l.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 text-sm font-medium">
                <td className="px-2 py-2">Deductions subtotal</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {money.format(payout.recurringTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {/* Net */}
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">Net payable</div>
            <div className="text-xs text-emerald-600">
              loads {money.format(payout.loadsSubtotal)} − deductions{' '}
              {money.format(payout.recurringTotal)}
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-800">
            {money.format(payout.netTotal)}
          </div>
        </div>
      </section>

      {payout.notes && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{payout.notes}</p>
        </section>
      )}
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
  accent?: boolean;
}) {
  return (
    <div
      className={
        'rounded-lg border p-3 shadow-sm ' +
        (accent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white')
      }
    >
      <div
        className={
          'text-xs uppercase tracking-wide ' +
          (accent ? 'text-emerald-700' : 'text-slate-500')
        }
      >
        {label}
      </div>
      <div
        className={
          'mt-1 text-lg font-semibold tabular-nums ' +
          (accent ? 'text-emerald-800' : 'text-slate-900')
        }
      >
        {value}
      </div>
    </div>
  );
}
