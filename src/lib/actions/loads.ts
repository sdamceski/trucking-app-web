'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createLoad as storeCreateLoad,
  deleteLoad as storeDeleteLoad,
  getLoad,
  updateLoad as storeUpdateLoad,
} from '@/lib/store';
import { LOAD_STATUSES } from '@/lib/types';
import type { LoadStatus } from '@/lib/types';
import { requireAdmin, requireTrucker } from '@/lib/auth/dal';

const VALID_STATUS = new Set<string>(LOAD_STATUSES);
const TRUCKER_ALLOWED_STATUS = new Set<LoadStatus>(['picked_up', 'delivered']);

function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function n(v: FormDataEntryValue | null): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function b(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true' || v === '1';
}

function loadFromForm(fd: FormData) {
  const status = s(fd.get('status'));
  return {
    pickupDate: s(fd.get('pickupDate')),
    deliveryDate: s(fd.get('deliveryDate')),
    truckerId: s(fd.get('truckerId')),
    originCompany: s(fd.get('originCompany')),
    originAddress: s(fd.get('originAddress')),
    destinationCompany: s(fd.get('destinationCompany')),
    destinationAddress: s(fd.get('destinationAddress')),
    loadPrice: n(fd.get('loadPrice')),
    truckerRate: n(fd.get('truckerRate')),
    reference: s(fd.get('reference')),
    notes: s(fd.get('notes')),
    status: VALID_STATUS.has(status) ? (status as LoadStatus) : undefined,
  };
}

export async function createLoad(fd: FormData) {
  await requireAdmin();
  const input = loadFromForm(fd);
  if (!input.pickupDate) {
    throw new Error('Pickup date is required');
  }
  const created = await storeCreateLoad(input);
  revalidatePath('/loads');
  revalidatePath('/reports');
  redirect(`/loads/${created.id}`);
}

export async function updateLoad(id: string, fd: FormData) {
  await requireAdmin();
  const input = loadFromForm(fd);
  // Booleans aren't coming through (no checkboxes in the main form);
  // flag/cancel actions have dedicated server actions below.
  await storeUpdateLoad(id, input);
  revalidatePath('/loads');
  revalidatePath('/reports');
  revalidatePath(`/loads/${id}`);
}

export async function setLoadStatus(id: string, status: LoadStatus) {
  await requireAdmin();
  if (!VALID_STATUS.has(status)) throw new Error('Invalid status');
  await storeUpdateLoad(id, { status });
  revalidatePath('/loads');
  revalidatePath('/reports');
  revalidatePath(`/loads/${id}`);
}

export async function setMyLoadStatus(id: string, status: LoadStatus, date?: string) {
  const session = await requireTrucker();
  if (!TRUCKER_ALLOWED_STATUS.has(status)) {
    throw new Error('Truckers can only set status to picked up or delivered');
  }
  const load = await getLoad(id);
  if (!load || load.truckerId !== session.truckerId) {
    throw new Error('Load not found');
  }
  const patch: Record<string, unknown> = { status };
  const stamp = (date ?? '').trim() || new Date().toISOString().slice(0, 10);
  if (status === 'picked_up') patch.pickedUpAt = stamp;
  if (status === 'delivered') patch.deliveredAt = stamp;
  await storeUpdateLoad(id, patch);
  revalidatePath('/my');
  revalidatePath(`/my/loads/${id}`);
}

export async function toggleFlag(
  id: string,
  flag: 'invoiced' | 'paid' | 'cancelled',
  value: boolean,
  cancellationReason?: string,
) {
  await requireAdmin();
  const patch: Record<string, unknown> = { [flag]: value };
  if (flag === 'cancelled') {
    patch.cancellationReason = value ? (cancellationReason ?? '').trim() : '';
  }
  await storeUpdateLoad(id, patch);
  revalidatePath('/loads');
  revalidatePath('/reports');
  revalidatePath(`/loads/${id}`);
}

export async function setInvoiced(id: string, date: string, note: string) {
  await requireAdmin();
  await storeUpdateLoad(id, {
    invoiced: true,
    invoicedAt: (date || '').trim(),
    invoicedNote: (note || '').trim(),
  });
  revalidatePath('/loads');
  revalidatePath('/reports');
  revalidatePath(`/loads/${id}`);
}

export async function clearInvoiced(id: string) {
  await requireAdmin();
  await storeUpdateLoad(id, { invoiced: false, invoicedAt: '', invoicedNote: '' });
  revalidatePath('/loads');
  revalidatePath('/reports');
  revalidatePath(`/loads/${id}`);
}

export async function deleteLoad(id: string) {
  await requireAdmin();
  await storeDeleteLoad(id);
  revalidatePath('/loads');
  revalidatePath('/reports');
  redirect('/loads');
}
