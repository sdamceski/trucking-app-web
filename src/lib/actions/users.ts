'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createTrucker as storeCreateTrucker } from '@/lib/store';
import { requireAdmin } from '@/lib/auth/dal';
import type { Role } from '@prisma/client';

function s(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function n(v: FormDataEntryValue | null): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

function parseRole(value: string): Role {
  return value === 'admin' ? 'admin' : 'trucker';
}

export async function createUser(fd: FormData): Promise<void> {
  await requireAdmin();
  const email = s(fd.get('email')).toLowerCase();
  const role = parseRole(s(fd.get('role')));
  const truckerMode = s(fd.get('truckerMode')); // 'existing' | 'new'
  let truckerId: string | null = s(fd.get('truckerId')) || null;

  if (!email || !email.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('A user with that email already exists.');

  if (role === 'trucker') {
    if (truckerMode === 'new') {
      const name = s(fd.get('newTruckerName'));
      if (!name) throw new Error('Trucker name is required.');
      const created = await storeCreateTrucker({
        name,
        phone: s(fd.get('newTruckerPhone')),
        email: s(fd.get('newTruckerEmail')) || email,
        truckNumber: s(fd.get('newTruckerTruckNumber')),
        notes: s(fd.get('newTruckerNotes')),
        commissionPercent: n(fd.get('newTruckerCommissionPercent')),
      });
      truckerId = created.id;
      revalidatePath('/truckers');
    } else {
      if (!truckerId) throw new Error('Select a trucker to link this user to.');
      const trucker = await prisma.trucker.findUnique({
        where: { id: truckerId },
        include: { user: { select: { id: true } } },
      });
      if (!trucker) throw new Error('Trucker not found.');
      if (trucker.user) throw new Error('That trucker is already linked to another user.');
    }
  } else {
    truckerId = null;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const created = await prisma.user.create({
    data: { email, passwordHash, role, truckerId },
  });

  revalidatePath('/users');
  if (truckerId) revalidatePath(`/truckers/${truckerId}`);
  redirect(`/users/${created.id}?invited=${encodeURIComponent(tempPassword)}`);
}

export async function updateUser(id: string, fd: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = s(fd.get('email')).toLowerCase();
  const role = parseRole(s(fd.get('role')));
  const truckerId = s(fd.get('truckerId')) || null;

  if (!email || !email.includes('@')) {
    throw new Error('A valid email address is required.');
  }
  if (role === 'trucker' && !truckerId) {
    throw new Error('Select a trucker to link this user to.');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error('User not found.');

  // Don't let an admin demote themselves.
  if (session.userId === id && target.role === 'admin' && role !== 'admin') {
    throw new Error('You cannot change your own role from admin.');
  }

  // Email uniqueness check (skip if unchanged).
  if (email !== target.email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) throw new Error('Another user already uses that email.');
  }

  if (role === 'trucker' && truckerId && truckerId !== target.truckerId) {
    const trucker = await prisma.trucker.findUnique({
      where: { id: truckerId },
      include: { user: { select: { id: true } } },
    });
    if (!trucker) throw new Error('Trucker not found.');
    if (trucker.user && trucker.user.id !== id) {
      throw new Error('That trucker is already linked to another user.');
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      email,
      role,
      truckerId: role === 'trucker' ? truckerId : null,
    },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  if (target.truckerId) revalidatePath(`/truckers/${target.truckerId}`);
  if (truckerId && truckerId !== target.truckerId) revalidatePath(`/truckers/${truckerId}`);
}

export async function resetUserPassword(id: string): Promise<{ password: string }> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found.');

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { password };
}

export async function deleteUser(id: string): Promise<void> {
  const session = await requireAdmin();
  if (session.userId === id) {
    throw new Error('You cannot delete your own account.');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;

  await prisma.user.delete({ where: { id } });
  revalidatePath('/users');
  if (user.truckerId) revalidatePath(`/truckers/${user.truckerId}`);
  redirect('/users');
}
