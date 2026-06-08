import {
  FeeBreakdownLine,
  Load,
  LoadFinancials,
  PayoutSnapshot,
  PerLoadFee,
  Trucker,
} from './types';

export function makePayoutSnapshot(trucker: Trucker): PayoutSnapshot {
  return {
    truckerId: trucker.id,
    commissionPercent: trucker.commissionPercent,
    perLoadFees: trucker.perLoadFees.map((f) => ({ ...f })),
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Compute trucker payout + company margin. Uses the load's payoutSnapshot
 * (frozen at assignment time) if present, otherwise falls back to the
 * trucker's current config.
 */
export function computeLoadFinancials(load: Load, trucker?: Trucker): LoadFinancials {
  const base = load.truckerRate || load.loadPrice || 0;
  const snapshot = load.payoutSnapshot;

  const commissionPercent = snapshot?.commissionPercent ?? trucker?.commissionPercent ?? 0;
  const perLoadFees: PerLoadFee[] = snapshot?.perLoadFees ?? trucker?.perLoadFees ?? [];

  const commissionAmount = +(base * (commissionPercent / 100)).toFixed(2);

  const breakdown: FeeBreakdownLine[] = [];
  if (commissionAmount > 0) {
    breakdown.push({
      source: 'commission',
      name: `Commission (${commissionPercent}%)`,
      amount: commissionAmount,
    });
  }

  let feesTotal = commissionAmount;
  for (const fee of perLoadFees) {
    const amount =
      fee.type === 'percent' ? +(base * (fee.amount / 100)).toFixed(2) : +fee.amount.toFixed(2);
    if (amount > 0) {
      breakdown.push({ source: 'perLoadFee', name: fee.name, amount });
      feesTotal += amount;
    }
  }

  feesTotal = +feesTotal.toFixed(2);
  const truckerPayout = +(base - feesTotal).toFixed(2);
  const companyMargin = +((load.loadPrice || 0) - truckerPayout).toFixed(2);

  return {
    base,
    commissionPercent,
    commissionAmount,
    feeBreakdown: breakdown,
    feesTotal,
    truckerPayout,
    companyMargin,
  };
}

export function decorateLoad(load: Load, truckersById: Map<string, Trucker>) {
  const trucker = load.truckerId ? truckersById.get(load.truckerId) : undefined;
  return { ...load, financials: computeLoadFinancials(load, trucker) };
}
