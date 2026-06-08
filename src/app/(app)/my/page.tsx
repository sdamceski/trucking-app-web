import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import MyLoadsList from '@/components/MyLoadsList';

export const metadata = { title: 'My loads' };

type Filter = 'open' | 'all';

export default async function MyLoadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'trucker' || !user.truckerId) redirect('/login');

  const sp = await searchParams;
  const rawShow = Array.isArray(sp.show) ? sp.show[0] : sp.show;
  const filter: Filter = rawShow === 'all' ? 'all' : 'open';

  const [trucker, loads, openCount] = await Promise.all([
    prisma.trucker.findUnique({ where: { id: user.truckerId } }),
    prisma.load.findMany({
      where: {
        truckerId: user.truckerId,
        cancelled: false,
        ...(filter === 'open' ? { paid: false } : {}),
      },
      orderBy: { pickupDate: 'desc' },
    }),
    prisma.load.count({
      where: { truckerId: user.truckerId, cancelled: false, paid: false },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My loads</h1>
        <p className="text-sm text-slate-500">
          {trucker?.name ?? 'Hello'} · showing {loads.length} ·{' '}
          {openCount} open
        </p>
      </div>

      <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 text-sm shadow-sm">
        <FilterTab href="/my" label="Open" active={filter === 'open'} />
        <FilterTab href="/my?show=all" label="All" active={filter === 'all'} />
      </div>

      <MyLoadsList
        loads={loads.map((l) => ({
          id: l.id,
          status: l.status,
          pickupDate: l.pickupDate,
          deliveryDate: l.deliveryDate,
          pickedUpAt: l.pickedUpAt,
          deliveredAt: l.deliveredAt,
          originCompany: l.originCompany,
          originAddress: l.originAddress,
          destinationCompany: l.destinationCompany,
          destinationAddress: l.destinationAddress,
          reference: l.reference,
          notes: l.notes,
          paid: l.paid,
        }))}
        emptyMessage={
          filter === 'open'
            ? 'No open loads. Tap “All” to see settled ones too.'
            : 'No loads assigned to you yet.'
        }
      />
    </div>
  );
}

function FilterTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        'rounded px-3 py-1.5 font-medium transition-colors ' +
        (active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
      }
    >
      {label}
    </Link>
  );
}
