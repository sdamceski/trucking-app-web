'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import {
  createTrucker as storeCreateTrucker,
  deleteTrucker as storeDeleteTrucker,
  getTrucker,
  updateTrucker as storeUpdateTrucker,
} from '@/lib/store';
import { newId } from '@/lib/ids';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/dal';
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
  await requireAdmin();
  const input = profileFromForm(fd);
  if (!input.name) {
    throw new Error('Name is required');
  }
  const created = await storeCreateTrucker(input);

  // If admin provided an email, also provision a login account.
  let tempPassword = '';
  const email = input.email.toLowerCase();
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.create({
        data: { email, passwordHash, role: 'trucker', truckerId: created.id },
      });
    }
  }

  revalidatePath('/truckers');
  redirect(
    tempPassword
      ? `/truckers/${created.id}?invited=${encodeURIComponent(tempPassword)}`
      : `/truckers/${created.id}`,
  );
}

function generateTempPassword(): string {
  // 10-char URL-safe random string (~60 bits of entropy).
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

export async function updateTruckerProfile(id: string, fd: FormData) {
  await requireAdmin();
  const input = profileFromForm(fd);
  if (!input.name) {
    throw new Error('Name is required');
  }
  await storeUpdateTrucker(id, input);
  revalidatePath('/truckers');
  revalidatePath(`/truckers/${id}`);
}

export async function deleteTrucker(id: string) {
  await requireAdmin();
  await storeDeleteTrucker(id);
  revalidatePath('/truckers');
  revalidatePath('/loads');
  redirect('/truckers');
}

export async function resetTruckerPassword(truckerId: string): Promise<{ password: string }> {
  await requireAdmin();
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  const email = trucker.email.toLowerCase();
  if (!email) throw new Error('Trucker has no email on file');
  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'trucker', truckerId },
    create: { email, passwordHash, role: 'trucker', truckerId },
  });
  return { password };
}

// ---- Fees ----

export async function addPerLoadFee(truckerId: string, fd: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  await storeUpdateTrucker(truckerId, {
    perLoadFees: trucker.perLoadFees.filter((f) => f.id !== feeId),
  });
  revalidatePath(`/truckers/${truckerId}`);
}

export async function addRecurringFee(truckerId: string, fd: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  const trucker = await getTrucker(truckerId);
  if (!trucker) throw new Error('Trucker not found');
  await storeUpdateTrucker(truckerId, {
    recurringFees: trucker.recurringFees.filter((f) => f.id !== feeId),
  });
  revalidatePath(`/truckers/${truckerId}`);
}

// (no type re-exports: server-action files must only export async functions)
