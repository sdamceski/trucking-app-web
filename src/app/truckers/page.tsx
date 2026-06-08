import { getTruckers } from '@/lib/store';

export default async function TruckersPage() {
  const truckers = await getTruckers();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Truckers</h1>
          <p className="text-sm text-slate-500">{truckers.length} on file</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
        >
          + New trucker
        </button>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {truckers.map((t) => (
          <li key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500">{t.id}</div>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div>Truck {t.truckNumber || '—'}</div>
                <div className="text-xs text-slate-500">{t.commissionPercent}% commission</div>
              </div>
            </div>
            {(t.phone || t.email) && (
              <div className="mt-2 text-xs text-slate-500">
                {t.phone}
                {t.phone && t.email ? ' · ' : ''}
                {t.email}
              </div>
            )}
          </li>
        ))}
        {truckers.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No truckers yet.
          </li>
        )}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Truck #</th>
                <th className="px-4 py-2 text-left font-medium">Phone</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-right font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {truckers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.id}</div>
                  </td>
                  <td className="px-4 py-2">{t.truckNumber || '—'}</td>
                  <td className="px-4 py-2">{t.phone || '—'}</td>
                  <td className="px-4 py-2">{t.email || '—'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{t.commissionPercent}%</td>
                </tr>
              ))}
              {truckers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No truckers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
