import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import InvitePasswordBanner from '@/components/InvitePasswordBanner';
import {
  DeleteUserButton,
  ResetUserPasswordButton,
  UserEditForm,
} from '@/components/UserDetailParts';

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const invited = typeof sp.invited === 'string' ? sp.invited : undefined;

  const [user, truckerOptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { trucker: { select: { id: true, name: true } } },
    }),
    // Truckers that are unlinked OR already linked to THIS user.
    prisma.trucker.findMany({
      where: { OR: [{ user: null }, { user: { id } }] },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!user) notFound();

  const isSelf = session.userId === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {invited ? <InvitePasswordBanner password={invited} email={user.email} /> : null}

      <div className="space-y-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All users
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{user.email}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {user.id}
              {user.trucker ? (
                <>
                  {' · '}
                  <Link
                    href={`/truckers/${user.trucker.id}`}
                    className="text-slate-600 underline hover:text-slate-900"
                  >
                    {user.trucker.name}
                  </Link>
                </>
              ) : null}
              {isSelf ? ' · (you)' : ''}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Account
        </h2>
        <UserEditForm
          user={{
            id: user.id,
            email: user.email,
            role: user.role,
            truckerId: user.truckerId,
          }}
          truckers={truckerOptions}
          isSelf={isSelf}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Password
          </h2>
          <p className="text-xs text-slate-500">
            Generate a new temporary password. Share it with the user; they can change it from
            their own profile.
          </p>
        </div>
        <ResetUserPasswordButton userId={user.id} />
      </section>

      <section className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Danger zone
          </h2>
          <p className="text-xs text-rose-700/80">
            Deleting a user removes their login. Linked trucker records and historical loads stay
            intact.
          </p>
        </div>
        <DeleteUserButton userId={user.id} email={user.email} isSelf={isSelf} />
      </section>
    </div>
  );
}
