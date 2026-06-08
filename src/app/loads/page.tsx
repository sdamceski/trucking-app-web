import { getLoads, getTruckers } from '@/lib/store';
import { LOAD_STATUSES, LoadStatus } from '@/lib/types';

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

export default async function LoadsPage() {
  const [loads, truckers] = await Promise.all([getLoads(), getTruckers()]);
  const truckerName = (id: string) => truckers.find((t) => t.id === id)?.name ?? '— unassigned —';

  const totalPrice = loads.reduce((s, l) => s + (l.loadPrice || 0), 0);
  const totalRate = loads.reduce((s, l) => s + (l.truckerRate || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loads</h1>
          <p className="text-sm text-slate-500">
            {loads.length} total · {money.format(totalPrice)} booked · {money.format(totalRate)} payouts
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          + New load
        </button>
      </div>

      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {loads.map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{l.reference || l.id}</div>
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
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Trucker</div>
                <div>{truckerName(l.truckerId)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Price / Rate</div>
                <div>
                  {money.format(l.loadPrice)} <span className="text-slate-400">/</span>{' '}
                  {money.format(l.truckerRate)}
                </div>
              </div>
            </div>
          </li>
        ))}
        {loads.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No loads yet.
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
                <th className="px-4 py-2 text-left font-medium">Trucker</th>
                <th className="px-4 py-2 text-left font-medium">Origin</th>
                <th className="px-4 py-2 text-left font-medium">Destination</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Load price</th>
                <th className="px-4 py-2 text-right font-medium">Trucker rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{l.reference || '—'}</div>
                    <div className="text-xs text-slate-400">{l.id}</div>
                  </td>
                  <td className="px-4 py-2">{truckerName(l.truckerId)}</td>
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
                  <td className="px-4 py-2 text-right tabular-nums">{money.format(l.truckerRate)}</td>
                </tr>
              ))}
              {loads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No loads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Available statuses: {LOAD_STATUSES.join(' · ')}
      </p>
    </div>
  );
}
