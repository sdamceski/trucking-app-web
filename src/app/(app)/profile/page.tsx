import { requireSession } from '@/lib/auth/dal';
import { EmailForm, PasswordForm } from '@/components/ProfileForms';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500">
          Signed in as <span className="font-medium">{session.email}</span> ·{' '}
          <span className="uppercase tracking-wide">{session.role}</span>
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Email
        </h2>
        <p className="text-xs text-slate-500">
          Changing your email also changes the address you sign in with.
        </p>
        <EmailForm currentEmail={session.email} />
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Password
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
