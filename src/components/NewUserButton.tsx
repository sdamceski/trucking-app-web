'use client';

import { useState, useTransition } from 'react';
import Sheet from './Sheet';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import { createUser } from '@/lib/actions/users';

export type TruckerOption = { id: string; name: string };

export default function NewUserButton({ truckers }: { truckers: TruckerOption[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'trucker'>('admin');
  const [truckerMode, setTruckerMode] = useState<'existing' | 'new'>(
    truckers.length === 0 ? 'new' : 'existing',
  );
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
            <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <input type="hidden" name="truckerMode" value={truckerMode} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTruckerMode('existing')}
                  disabled={truckers.length === 0}
                  className={
                    'flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ' +
                    (truckerMode === 'existing'
                      ? 'border-slate-900 bg-white text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100') +
                    (truckers.length === 0 ? ' cursor-not-allowed opacity-50' : '')
                  }
                >
                  Link existing
                </button>
                <button
                  type="button"
                  onClick={() => setTruckerMode('new')}
                  className={
                    'flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ' +
                    (truckerMode === 'new'
                      ? 'border-slate-900 bg-white text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')
                  }
                >
                  Create new
                </button>
              </div>

              {truckerMode === 'existing' ? (
                <Field
                  label="Linked trucker"
                  hint="Only truckers without a login are shown."
                >
                  <select name="truckerId" required className={inputCx} defaultValue="">
                    <option value="" disabled>
                      Select a trucker…
                    </option>
                    {truckers.length === 0 ? (
                      <option value="" disabled>
                        No unlinked truckers — switch to “Create new”.
                      </option>
                    ) : null}
                    {truckers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div className="space-y-3">
                  <Field label="Trucker name">
                    <input
                      name="newTruckerName"
                      type="text"
                      required={truckerMode === 'new'}
                      className={inputCx}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Phone">
                      <input name="newTruckerPhone" type="tel" className={inputCx} />
                    </Field>
                    <Field label="Truck #">
                      <input name="newTruckerTruckNumber" type="text" className={inputCx} />
                    </Field>
                    <Field label="Commission %" hint="0–100">
                      <input
                        name="newTruckerCommissionPercent"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        defaultValue={0}
                        className={inputCx}
                      />
                    </Field>
                    <Field label="Trucker email" hint="Defaults to the login email.">
                      <input name="newTruckerEmail" type="email" className={inputCx} />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <textarea name="newTruckerNotes" rows={2} className={inputCx} />
                  </Field>
                </div>
              )}
            </div>
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
