import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const metadata = { title: 'My payouts' };

export default async function MyPayoutsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'trucker' || !user.truckerId) redirect('/login');

  const payouts = await prisma.payout.findMany({
    where: { truckerId: user.truckerId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My payouts</h1>
        <p className="text-sm text-slate-500">
          {payouts.length} payout{payouts.length === 1 ? '' : 's'}
        </p>
      </div>

      {payouts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No payouts yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {payouts.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{p.id}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {p.periodStart || '—'} → {p.periodEnd || '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-700">
                    {money.format(p.netTotal)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Loads subtotal
                  </div>
                  <div>{money.format(p.loadsSubtotal)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Recurring
                  </div>
                  <div>{money.format(p.recurringTotal)}</div>
                </div>
              </div>
              {p.notes ? (
                <div className="mt-3 rounded-md bg-slate-50 p-2.5 text-sm text-slate-700">
                  {p.notes}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
