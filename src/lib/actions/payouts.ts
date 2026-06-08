'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createPayout as storeCreatePayout,
  voidPayout as storeVoidPayout,
} from '@/lib/store';
import { requireAdmin } from '@/lib/auth/dal';

function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function n(v: FormDataEntryValue | null): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export async function createPayout(truckerId: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const loadIds = fd.getAll('loadIds').filter((v): v is string => typeof v === 'string');
  const recurringIds = fd
    .getAll('recurringIds')
    .filter((v): v is string => typeof v === 'string');
  const recurringFees = recurringIds.map((id) => ({
    feeId: id,
    amount: n(fd.get(`recurringAmount_${id}`)),
  }));

  const payout = await storeCreatePayout({
    truckerId,
    loadIds,
    recurringFees,
    periodStart: s(fd.get('periodStart')),
    periodEnd: s(fd.get('periodEnd')),
    notes: s(fd.get('notes')),
  });

  if (!payout) {
    throw new Error('Could not create payout (no loads or fees selected).');
  }

  revalidatePath(`/truckers/${truckerId}`);
  revalidatePath('/loads');
  revalidatePath(`/payouts/${payout.id}`);
  redirect(`/payouts/${payout.id}`);
}

export async function voidPayout(id: string, truckerId: string): Promise<void> {
  await requireAdmin();
  await storeVoidPayout(id);
  revalidatePath(`/truckers/${truckerId}`);
  revalidatePath('/loads');
  redirect(`/truckers/${truckerId}?tab=payouts`);
}
