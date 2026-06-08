import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import NewUserButton from '@/components/NewUserButton';
import RowLink from '@/components/RowLink';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  await requireAdmin();

  const [users, unlinkedTruckers] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      include: { trucker: { select: { id: true, name: true } } },
    }),
    prisma.trucker.findMany({
      where: { user: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const truckerCount = users.length - adminCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">
            {users.length} total · {adminCount} admin · {truckerCount} trucker
          </p>
        </div>
        <NewUserButton truckers={unlinkedTruckers} />
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/users/${u.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{u.email}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {u.trucker ? `→ ${u.trucker.name}` : 'No linked trucker'}
                  </div>
                </div>
                <RolePill role={u.role} />
              </div>
            </Link>
          </li>
        ))}
        {users.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No users yet.
          </li>
        )}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Linked trucker</th>
                <th className="px-4 py-2 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <RowLink key={u.id} href={`/users/${u.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs text-slate-400">{u.id}</div>
                  </td>
                  <td className="px-4 py-2">
                    <RolePill role={u.role} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {u.trucker ? u.trucker.name : '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </RowLink>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: 'admin' | 'trucker' }) {
  const cx =
    role === 'admin'
      ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
      : 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span
      className={
        'rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset ' +
        cx
      }
    >
      {role}
    </span>
  );
}
