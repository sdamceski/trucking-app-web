'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie, createSessionCookie } from '@/lib/auth/session';

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, truckerId: true, passwordHash: true },
  });

  // Constant-ish time: always run bcrypt even if user is missing, to avoid timing leaks.
  const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvaliduvwxyzabcdefghij';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return { error: 'Invalid email or password.' };
  }

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    truckerId: user.truckerId,
  });

  redirect(user.role === 'admin' ? '/loads' : '/my');
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
