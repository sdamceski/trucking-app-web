'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createTrucker as storeCreateTrucker,
  deleteTrucker as storeDeleteTrucker,
  getTrucker,
  updateTrucker as storeUpdateTrucker,
} from '@/lib/store';
import { newId } from '@/lib/ids';
import { RECURRING_FREQUENCIES } from '@/lib/types';
import type { PerLoadFee, RecurringFee, RecurringFrequency } from '@/lib/types';

function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function n(v: FormDataEntryValue | null): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function profileFromForm(fd: FormData) {
  return {
    name: s(fd.get('name')),
    phone: s(fd.get('phone')),
    email: s(fd.get('email')),
    truckNumber: s(fd.get('truckNumber')),
    notes: s(fd.get('notes')),
    commissionPercent: n(fd.get('commissionPercent')),
  };
}

export async function createTrucker(fd: FormData) {
  const input = profileFromForm(fd);
  if (!input.name) {
    throw new Error('Name is required');
  }
  const created = await storeCreateTrucker(input);
  revalidatePath('/truckers');
  redirect(`/truckers/${created.id}`);
}

export async function updateTruckerProfile(id: string, fd: FormData) {
  const input = profileFromForm(fd);
  if (!input.name) {
    throw new Error('Name is required');
  }
  await storeUpdateTrucker(id, input);
  revalidatePath('/truckers');
  revalidatePath(`/truckers/${id}`);
}

export async function deleteTrucker(id: string) {
  await storeDeleteTrucker(id);
  revalidatePath('/truckers');
  revalidatePath('/loads');
  redirect('/truckers');
}

// ---- Fees ----

export async function addPerLoadFee(truckerId: string, fd: FormData) {
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  const fee: PerLoadFee = {
    id: newId('FEE'),
    name: s(fd.get('name')) || 'Fee',
    type: (s(fd.get('type')) || 'fixed') as PerLoadFee['type'],
    amount: n(fd.get('amount')),
  };
  await storeUpdateTrucker(truckerId, { perLoadFees: [...trucker.perLoadFees, fee] });
  revalidatePath(`/truckers/${truckerId}`);
}

export async function removePerLoadFee(truckerId: string, feeId: string) {
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  await storeUpdateTrucker(truckerId, {
    perLoadFees: trucker.perLoadFees.filter((f) => f.id !== feeId),
  });
  revalidatePath(`/truckers/${truckerId}`);
}

export async function addRecurringFee(truckerId: string, fd: FormData) {
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  const freqRaw = s(fd.get('frequency'));
  const frequency = (RECURRING_FREQUENCIES as readonly string[]).includes(freqRaw)
    ? (freqRaw as RecurringFrequency)
    : 'monthly';
  const fee: RecurringFee = {
    id: newId('FEE'),
    name: s(fd.get('name')) || 'Fee',
    type: (s(fd.get('type')) || 'fixed') as RecurringFee['type'],
    amount: n(fd.get('amount')),
    frequency,
  };
  await storeUpdateTrucker(truckerId, {
    recurringFees: [...trucker.recurringFees, fee],
  });
  revalidatePath(`/truckers/${truckerId}`);
}

export async function removeRecurringFee(truckerId: string, feeId: string) {
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  await storeUpdateTrucker(truckerId, {
    recurringFees: trucker.recurringFees.filter((f) => f.id !== feeId),
  });
  revalidatePath(`/truckers/${truckerId}`);
}

// (no type re-exports: server-action files must only export async functions)
