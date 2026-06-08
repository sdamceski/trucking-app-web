'use client';

import { useState } from 'react';

export default function InvitePasswordBanner({
  password,
  email,
}: {
  password: string;
  email: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard might be unavailable */
    }
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Login created — share these once</h3>
          <p className="mt-1 text-xs text-amber-800">
            This password is shown only this one time. Send it to the trucker; they can sign in at{' '}
            <code>/login</code>.
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 text-amber-800">Email:</dt>
              <dd className="font-mono text-amber-900">{email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 text-amber-800">Password:</dt>
              <dd className="select-all font-mono text-amber-900">{password}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-amber-200 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-300"
        >
          {copied ? 'Copied!' : 'Copy password'}
        </button>
      </div>
    </div>
  );
}
