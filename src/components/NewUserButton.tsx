'use client';

import { useState, useTransition } from 'react';
import Sheet from './Sheet';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import { createUser } from '@/lib/actions/users';

export type TruckerOption = { id: string; name: string };

export default function NewUserButton({ truckers }: { truckers: TruckerOption[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'trucker'>('admin');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createUser(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create user');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      >
        + New user
      </button>
      <Sheet
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="New user"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" form="new-user-form" disabled={pending} className={btnPrimary}>
              {pending ? 'Creating…' : 'Create user'}
            </button>
          </div>
        }
      >
        <form id="new-user-form" action={onSubmit} className="space-y-4">
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              className={inputCx}
              autoFocus
            />
          </Field>

          <Field label="Role">
            <div className="flex gap-2">
              {(['admin', 'trucker'] as const).map((r) => (
                <label
                  key={r}
                  className={
                    'flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium capitalize ' +
                    (role === r
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')
                  }
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="sr-only"
                  />
                  {r}
                </label>
              ))}
            </div>
          </Field>

          {role === 'trucker' ? (
            <Field
              label="Linked trucker"
              hint="The user will only see loads and payouts for this trucker."
            >
              <select name="truckerId" required className={inputCx} defaultValue="">
                <option value="" disabled>
                  Select a trucker…
                </option>
                {truckers.length === 0 ? (
                  <option value="" disabled>
                    No unlinked truckers — create one first.
                  </option>
                ) : null}
                {truckers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            A temporary password will be generated and shown once on the next screen.
          </p>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </form>
      </Sheet>
    </>
  );
}
