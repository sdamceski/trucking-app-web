'use client';

import { useTransition } from 'react';
import { voidPayout } from '@/lib/actions/payouts';
import { btnDanger } from './form';

export default function VoidPayoutButton({
  payoutId,
  truckerId,
}: {
  payoutId: string;
  truckerId: string;
}) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('Void this payout? Loads on it will go back to unpaid.')) return;
    startTransition(() => voidPayout(payoutId, truckerId));
  }
  return (
    <button type="button" onClick={onClick} disabled={pending} className={btnDanger}>
      {pending ? 'Voiding…' : 'Void payout'}
    </button>
  );
}
