import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoads, getPayoutsByTrucker, getTrucker } from '@/lib/store';
import { computeLoadFinancials } from '@/lib/financials';
import NewPayoutForm, { EligibleLoadPreview } from '@/components/NewPayoutForm';

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewPayoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trucker, allLoads, payouts] = await Promise.all([
    getTrucker(id),
    getLoads(),
    getPayoutsByTrucker(id),
  ]);
  if (!trucker) notFound();

  const eligible: EligibleLoadPreview[] = allLoads
    .filter((l) => l.truckerId === trucker.id && !l.payoutId && !l.cancelled)
    .map((l) => {
      const fin = computeLoadFinancials(l, trucker);
      return {
        id: l.id,
        ref: l.reference || l.id,
        originCompany: l.originCompany,
        destinationCompany: l.destinationCompany,
        pickupDate: l.pickupDate,
        base: fin.base,
        feesTotal: fin.feesTotal,
        truckerPayout: fin.truckerPayout,
      };
    });

  // Auto-suggest period: day after most recent payout's periodEnd → today.
  const lastWithPeriod = payouts.find((p) => p.periodEnd);
  const suggestedStart = lastWithPeriod ? addDays(lastWithPeriod.periodEnd, 1) : '';
  const suggestedEnd = todayISO();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/truckers/${trucker.id}?tab=payouts`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to {trucker.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New payout</h1>
        <p className="text-sm text-slate-500">
          {trucker.name} · {trucker.id}
          {lastWithPeriod ? ` · last payout ended ${lastWithPeriod.periodEnd}` : ''}
        </p>
      </div>

      <NewPayoutForm
        truckerId={trucker.id}
        truckerName={trucker.name}
        loads={eligible}
        recurringFees={trucker.recurringFees}
        defaultPeriodStart={suggestedStart}
        defaultPeriodEnd={suggestedEnd}
      />
    </div>
  );
}
