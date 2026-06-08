import Link from 'next/link';
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
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      netTotal: true,
      createdAt: true,
      loadLines: true,
    },
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
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const loadCount = Array.isArray(p.loadLines) ? p.loadLines.length : 0;
              const period =
                p.periodStart || p.periodEnd
                  ? `${p.periodStart || '—'} → ${p.periodEnd || '—'}`
                  : `Created ${new Date(p.createdAt).toLocaleDateString()}`;
              return (
                <li key={p.id}>
                  <Link
                    href={`/my/payouts/${p.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.id}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {period} · {loadCount} load{loadCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-semibold text-emerald-700 tabular-nums">
                          {money.format(p.netTotal)}
                        </div>
                      </div>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="h-4 w-4 text-slate-400"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
