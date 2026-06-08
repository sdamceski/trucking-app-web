import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import MyLoadsList from '@/components/MyLoadsList';

export const metadata = { title: 'My loads' };

export default async function MyLoadsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'trucker' || !user.truckerId) redirect('/login');

  const [trucker, loads] = await Promise.all([
    prisma.trucker.findUnique({ where: { id: user.truckerId } }),
    prisma.load.findMany({
      where: { truckerId: user.truckerId, cancelled: false },
      orderBy: { pickupDate: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My loads</h1>
        <p className="text-sm text-slate-500">
          {trucker?.name ?? 'Hello'} · {loads.length} load{loads.length === 1 ? '' : 's'}
        </p>
      </div>
      <MyLoadsList loads={loads.map((l) => ({
        id: l.id,
        status: l.status,
        pickupDate: l.pickupDate,
        deliveryDate: l.deliveryDate,
        originCompany: l.originCompany,
        originAddress: l.originAddress,
        destinationCompany: l.destinationCompany,
        destinationAddress: l.destinationAddress,
        reference: l.reference,
        notes: l.notes,
      }))} />
    </div>
  );
}
