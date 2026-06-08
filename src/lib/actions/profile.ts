'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/dal';
import { createSessionCookie } from '@/lib/auth/session';

export type ProfileState =
  | { ok?: string; error?: string; field?: 'email' | 'password' }
  | undefined;

export async function updateEmail(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const session = await requireSession();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const currentPassword = String(fd.get('currentPassword') ?? '');

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.', field: 'email' };
  }
  if (!currentPassword) {
    return { error: 'Enter your current password to confirm the change.', field: 'email' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, truckerId: true, passwordHash: true },
  });
  if (!user) return { error: 'Account not found.', field: 'email' };

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return { error: 'Current password is incorrect.', field: 'email' };

  if (email === user.email) {
    return { ok: 'Email unchanged.', field: 'email' };
  }

  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash) return { error: 'That email is already in use.', field: 'email' };

  await prisma.user.update({ where: { id: user.id }, data: { email } });

  // Refresh the session cookie so the new email shows in the UI.
  await createSessionCookie({
    userId: user.id,
    email,
    role: user.role,
    truckerId: user.truckerId,
  });

  revalidatePath('/profile');
  return { ok: 'Email updated.', field: 'email' };
}

export async function changePassword(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const session = await requireSession();
  const currentPassword = String(fd.get('currentPassword') ?? '');
  const newPassword = String(fd.get('newPassword') ?? '');
  const confirmPassword = String(fd.get('confirmPassword') ?? '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required.', field: 'password' };
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.', field: 'password' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.', field: 'password' };
  }
  if (newPassword === currentPassword) {
    return { error: 'New password must be different from current.', field: 'password' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) return { error: 'Account not found.', field: 'password' };

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return { error: 'Current password is incorrect.', field: 'password' };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: 'Password changed.', field: 'password' };
}
