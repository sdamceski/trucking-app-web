'use client';

import { useState, useTransition } from 'react';
import { Field, btnDanger, btnPrimary, inputCx } from './form';
import { deleteUser, resetUserPassword, updateUser } from '@/lib/actions/users';

export type TruckerOption = { id: string; name: string };

type UserInput = {
  id: string;
  email: string;
  role: 'admin' | 'trucker';
  truckerId: string | null;
};

export function UserEditForm({
  user,
  truckers,
  isSelf,
}: {
  user: UserInput;
  truckers: TruckerOption[];
  isSelf: boolean;
}) {
  const [role, setRole] = useState<'admin' | 'trucker'>(user.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    setOk(null);
    startTransition(async () => {
      try {
        await updateUser(user.id, fd);
        setOk('Saved.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          defaultValue={user.email}
          className={inputCx}
        />
      </Field>

      <Field label="Role">
        <div className="flex gap-2">
          {(['admin', 'trucker'] as const).map((r) => {
            const disabled = isSelf && user.role === 'admin' && r !== 'admin';
            return (
              <label
                key={r}
                className={
                  'flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium capitalize ' +
                  (role === r
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50') +
                  (disabled ? ' cursor-not-allowed opacity-40' : '')
                }
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  disabled={disabled}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                {r}
              </label>
            );
          })}
        </div>
        {isSelf && user.role === 'admin' ? (
          <p className="mt-1 text-xs text-slate-500">
            You can&apos;t change your own role from admin.
          </p>
        ) : null}
      </Field>

      {role === 'trucker' ? (
        <Field label="Linked trucker">
          <select
            name="truckerId"
            required
            defaultValue={user.truckerId ?? ''}
            className={inputCx}
          >
            <option value="" disabled>
              Select a trucker…
            </option>
            {truckers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      {ok ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

export function ResetUserPasswordButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (!confirm('Generate a new password for this user? The old one will stop working.')) return;
    setError(null);
    start(async () => {
      try {
        const result = await resetUserPassword(userId);
        setPassword(result.password);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  if (password) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
        <div className="font-semibold text-amber-900">New password (shown once)</div>
        <div className="mt-1 select-all font-mono text-amber-900">{password}</div>
        <button
          type="button"
          onClick={() => setPassword(null)}
          className="mt-2 text-xs text-amber-700 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={reset}
        disabled={pending}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? 'Generating…' : 'Reset password'}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function DeleteUserButton({
  userId,
  email,
  isSelf,
}: {
  userId: string;
  email: string;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (isSelf) return;
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      try {
        await deleteUser(userId);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending || isSelf}
        className={btnDanger}
        title={isSelf ? "You can't delete your own account." : undefined}
      >
        {pending ? 'Deleting…' : 'Delete user'}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
