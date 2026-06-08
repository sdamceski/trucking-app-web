'use client';

import { useActionState } from 'react';
import {
  changePassword,
  updateEmail,
  type ProfileState,
} from '@/lib/actions/profile';

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateEmail,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={currentEmail}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Current password</label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {state?.field === 'email' && state.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state?.field === 'email' && state.ok ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Update email'}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    changePassword,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Current password</label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">New password</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {state?.field === 'password' && state.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state?.field === 'password' && state.ok ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
