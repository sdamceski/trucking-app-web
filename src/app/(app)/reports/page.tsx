import { getLoads, getTruckers } from '@/lib/store';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function ReportsPage() {
  const [loads, truckers] = await Promise.all([getLoads(), getTruckers()]);

  const active = loads.filter((l) => !l.cancelled);
  const totalBooked = active.reduce((s, l) => s + (l.loadPrice || 0), 0);
  const totalPayout = active.reduce((s, l) => s + (l.truckerRate || 0), 0);
  const totalMargin = totalBooked - totalPayout;

  const stats = [
    { label: 'Active loads', value: active.length.toString() },
    { label: 'Truckers', value: truckers.length.toString() },
    { label: 'Booked revenue', value: money.format(totalBooked) },
    { label: 'Trucker payout', value: money.format(totalPayout) },
    { label: 'Company margin', value: money.format(totalMargin) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-slate-500">High-level view across all loads.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Detailed reports (by trucker, by date range, pay slips) coming in phase 2.
      </p>
    </div>
  );
}
