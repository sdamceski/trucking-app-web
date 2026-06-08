'use client';

import { useState, useTransition } from 'react';
import { resetTruckerPassword } from '@/lib/actions/truckers';

export default function ResetPasswordButton({ truckerId }: { truckerId: string }) {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (!confirm('Generate a new login password for this trucker? The old one will stop working.')) return;
    setError(null);
    start(async () => {
      try {
        const result = await resetTruckerPassword(truckerId);
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
