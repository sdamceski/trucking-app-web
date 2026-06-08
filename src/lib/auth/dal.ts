import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { readSessionCookie, type SessionPayload } from './session';

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return readSessionCookie();
});

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireSession();
  if (s.role !== 'admin') redirect('/my');
  return s;
}

export async function requireTrucker(): Promise<SessionPayload & { truckerId: string }> {
  const s = await requireSession();
  if (s.role !== 'trucker' || !s.truckerId) redirect('/loads');
  return s as SessionPayload & { truckerId: string };
}

export const getCurrentUser = cache(async () => {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({
    where: { id: s.userId },
    select: { id: true, email: true, role: true, truckerId: true },
  });
});
