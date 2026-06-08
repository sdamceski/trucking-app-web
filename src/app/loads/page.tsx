import { getLoads, getTruckers } from '@/lib/store';
import NewLoadButton from '@/components/NewLoadButton';
import LoadsFilters from '@/components/LoadsFilters';
import LoadsList, { applyLoadFilters, money } from '@/components/LoadsList';

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    flat[k] = Array.isArray(v) ? v[0] : v;
  }

  const [allLoads, truckers] = await Promise.all([getLoads(), getTruckers()]);
  const loads = applyLoadFilters(allLoads, flat);

  const totalPrice = loads.reduce((s, l) => s + (l.loadPrice || 0), 0);
  const totalRate = loads.reduce((s, l) => s + (l.truckerRate || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loads</h1>
          <p className="text-sm text-slate-500">
            {loads.length} of {allLoads.length} · {money.format(totalPrice)} booked ·{' '}
            {money.format(totalRate)} payouts
          </p>
        </div>
        <NewLoadButton truckers={truckers} />
      </div>

      <LoadsFilters truckers={truckers} activeCount={loads.length} />

      <LoadsList loads={loads} truckers={truckers} />
    </div>
  );
}
