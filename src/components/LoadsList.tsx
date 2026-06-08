import Link from 'next/link';
import { Load, LoadStatus, Trucker } from '@/lib/types';
import { effectiveTruckerRate } from '@/lib/financials';
import RowLink from './RowLink';
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

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function LoadsList({
  loads,
  truckers,
  emptyMessage = 'No loads match.',
  showTruckerColumn = true,
}: {
  loads: Load[];
  truckers: Trucker[];
  emptyMessage?: string;
  showTruckerColumn?: boolean;
}) {
  const truckerName = (id: string) =>
    truckers.find((t) => t.id === id)?.name ?? '— unassigned —';

  return (
    <>
      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {loads.map((l) => (
          <li key={l.id}>
            <Link
              href={`/loads/${l.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.reference || l.id}</span>
                    {l.documents.length > 0 && (
                      <span
                        title={`${l.documents.length} document(s)`}
                        className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        📎 {l.documents.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{l.id}</div>
                </div>
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
                    STATUS_PILL[l.status]
                  }
                >
                  {STATUS_LABEL[l.status]}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Origin</div>
                  <div>{l.originCompany || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Destination</div>
                  <div>{l.destinationCompany || '—'}</div>
                </div>
                {showTruckerColumn && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Trucker</div>
                    <div>{truckerName(l.truckerId)}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Invoiced</div>
                  <div>
                    {l.invoiced ? (
                      <span className="text-sky-700">✓ Yes</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Paid</div>
                  <div>
                    {l.payoutId ? (
                      <Link
                        href={`/payouts/${l.payoutId}`}
                        className="text-emerald-700 underline hover:text-emerald-800"
                      >
                        {l.payoutId}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Delivered</div>
                  <div>{l.deliveryDate || <span className="text-slate-400">—</span>}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Price / Rate</div>
                  <div>
                    {money.format(l.loadPrice)} <span className="text-slate-400">/</span>{' '}
                    {money.format(effectiveTruckerRate(l))}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {loads.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </li>
        )}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Ref</th>
                {showTruckerColumn && (
                  <th className="px-4 py-2 text-left font-medium">Trucker</th>
                )}
                <th className="px-4 py-2 text-left font-medium">Origin</th>
                <th className="px-4 py-2 text-left font-medium">Destination</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Load price</th>
                <th className="px-4 py-2 text-right font-medium">Trucker rate</th>
                <th className="px-4 py-2 text-left font-medium">Invoiced</th>
                <th className="px-4 py-2 text-left font-medium">Paid</th>
                <th className="px-4 py-2 text-left font-medium">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loads.map((l) => (
                <RowLink key={l.id} href={`/loads/${l.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.reference || '—'}</span>
                      {l.documents.length > 0 && (
                        <span
                          title={`${l.documents.length} document(s)`}
                          className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          📎 {l.documents.length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{l.id}</div>
                  </td>
                  {showTruckerColumn && (
                    <td className="px-4 py-2">{truckerName(l.truckerId)}</td>
                  )}
                  <td className="px-4 py-2">{l.originCompany || '—'}</td>
                  <td className="px-4 py-2">{l.destinationCompany || '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
                        STATUS_PILL[l.status]
                      }
                    >
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{money.format(l.loadPrice)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money.format(effectiveTruckerRate(l))}</td>
                  <td className="px-4 py-2">
                    {l.invoiced ? (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                        ✓ Invoiced
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {l.payoutId ? (
                      <Link
                        href={`/payouts/${l.payoutId}`}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                      >
                        ✓ {l.payoutId}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600 tabular-nums">
                    {l.deliveryDate || <span className="text-slate-400">—</span>}
                  </td>
                </RowLink>
              ))}
              {loads.length === 0 && (
                <tr>
                  <td
                    colSpan={showTruckerColumn ? 10 : 9}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function applyLoadFilters(
  loads: Load[],
  sp: Record<string, string | undefined>,
  opts: { skipTrucker?: boolean } = {},
): Load[] {
  // Invoiced and paid default to "no" (hide invoiced/paid loads). Pass `any` to show all.
  const invoiced = sp.invoiced || 'no';
  const paid = sp.paid || 'no';
  return loads.filter((l) => {
    if (sp.status && l.status !== sp.status) return false;
    if (!opts.skipTrucker && sp.trucker) {
      if (sp.trucker === '__none') {
        if (l.truckerId) return false;
      } else if (l.truckerId !== sp.trucker) {
        return false;
      }
    }
    if (invoiced === 'yes' && !l.invoiced) return false;
    if (invoiced === 'no' && l.invoiced) return false;
    if (paid === 'yes' && !l.paid) return false;
    if (paid === 'no' && l.paid) return false;
    if (sp.from && l.pickupDate && l.pickupDate < sp.from) return false;
    if (sp.to && l.pickupDate && l.pickupDate > sp.to) return false;
    if (sp.q) {
      const q = sp.q.toLowerCase();
      const hay = [
        l.id,
        l.reference,
        l.originCompany,
        l.originAddress,
        l.destinationCompany,
        l.destinationAddress,
        l.notes,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export { STATUS_LABEL, STATUS_PILL, money };
