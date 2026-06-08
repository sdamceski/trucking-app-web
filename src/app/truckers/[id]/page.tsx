import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoads, getPayoutsByTrucker, getTrucker, getTruckers } from '@/lib/store';
import {
  DeleteTruckerButton,
  PerLoadFees,
  RecurringFees,
  TruckerProfileForm,
} from '@/components/TruckerDetailParts';
import LoadsFilters from '@/components/LoadsFilters';
import LoadsList, { applyLoadFilters } from '@/components/LoadsList';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

type Tab = 'profile' | 'loads' | 'payouts';

export default async function TruckerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    flat[k] = Array.isArray(v) ? v[0] : v;
  }
  const tab: Tab =
    flat.tab === 'loads' ? 'loads' : flat.tab === 'payouts' ? 'payouts' : 'profile';

  const [trucker, allLoads, truckers, payouts] = await Promise.all([
    getTrucker(id),
    getLoads(),
    getTruckers(),
    getPayoutsByTrucker(id),
  ]);
  if (!trucker) notFound();

  const myLoads = allLoads.filter((l) => l.truckerId === trucker.id);
  const activeLoads = myLoads.filter((l) => !l.cancelled);
  const totalRate = activeLoads.reduce((s, l) => s + (l.truckerRate || 0), 0);
  const eligibleCount = myLoads.filter((l) => !l.payoutId && !l.cancelled).length;
  const unpaidCount = myLoads.filter((l) => !l.paid).length;
  const filteredLoads =
    tab === 'loads' ? applyLoadFilters(myLoads, flat, { skipTrucker: true }) : [];

  const basePath = `/truckers/${trucker.id}`;
  const tabs: { key: Tab; label: string; href: string }[] = [
    { key: 'profile', label: 'Profile', href: basePath },
    { key: 'loads', label: `Loads (${unpaidCount})`, href: `${basePath}?tab=loads` },
    {
      key: 'payouts',
      label: `Payouts (${payouts.length})`,
      href: `${basePath}?tab=payouts`,
    },
  ];

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

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={
                  'border-b-2 px-1 pb-3 text-sm font-medium transition whitespace-nowrap ' +
                  (active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Profile
            </h2>
            <TruckerProfileForm trucker={trucker} />
          </section>

          <div className="space-y-6">
            {/* Per-load fees */}
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Per-load fees
                </h2>
                <p className="text-xs text-slate-500">
                  Deducted from the trucker rate on every load assigned to this trucker. Snapshotted
                  at assignment time, so existing loads aren&apos;t affected by edits here.
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
                  Optional deductions you can add to a payout (insurance, plate, etc.).
                </p>
              </div>
              <RecurringFees trucker={trucker} />
            </section>
          </div>
        </div>
      )}

      {tab === 'loads' && (
        <div className="space-y-4">
          <LoadsFilters
            truckers={truckers}
            activeCount={filteredLoads.length}
            basePath={basePath}
            hideTrucker
            preserveParams={['tab']}
          />
          <LoadsList
            loads={filteredLoads}
            truckers={truckers}
            showTruckerColumn={false}
            emptyMessage="No loads for this trucker yet."
          />
        </div>
      )}

      {tab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {payouts.length} past payout{payouts.length === 1 ? '' : 's'} ·{' '}
              {eligibleCount} eligible load{eligibleCount === 1 ? '' : 's'} to settle
            </p>
            <Link
              href={`/truckers/${trucker.id}/payouts/new`}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              + New payout
            </Link>
          </div>

          {payouts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No payouts yet. Create one to settle delivered loads with this trucker.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Payout</th>
                    <th className="px-4 py-2 text-left font-medium">Created</th>
                    <th className="px-4 py-2 text-left font-medium">Period</th>
                    <th className="px-4 py-2 text-right font-medium">Loads</th>
                    <th className="px-4 py-2 text-right font-medium">Deductions</th>
                    <th className="px-4 py-2 text-right font-medium">Net</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{p.id}</div>
                        <div className="text-xs text-slate-400">
                          {p.loadLines.length} load{p.loadLines.length === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="px-4 py-2">{dt.format(new Date(p.createdAt))}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {p.periodStart || p.periodEnd
                          ? `${p.periodStart || '—'} → ${p.periodEnd || '—'}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {money.format(p.loadsSubtotal)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {money.format(p.recurringTotal)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">
                        {money.format(p.netTotal)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/payouts/${p.id}`}
                          className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
