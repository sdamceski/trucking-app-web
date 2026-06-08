import LoginForm from '@/components/LoginForm';
import { readSessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Sign in — Trucking Dispatch' };

export default async function LoginPage() {
  const session = await readSessionCookie();
  if (session) {
    redirect(session.role === 'admin' ? '/loads' : '/my');
  }
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-base text-white">
            TD
          </span>
          <span className="text-lg">Trucking Dispatch</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email and password.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
