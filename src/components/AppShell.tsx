import Link from 'next/link';
import BottomNav from './BottomNav';
import TopNav from './TopNav';
import UserMenu from './UserMenu';
import type { Role } from '@prisma/client';

export type ShellUser = { email: string; role: Role };

export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const homeHref = user.role === 'admin' ? '/loads' : '/my';
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      {/* Top bar: visible on all sizes, contains brand + (on md+) horizontal nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 md:px-6">
          <Link href={homeHref} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white text-sm">
              TD
            </span>
            <span className="text-base">Trucking Dispatch</span>
          </Link>
          <div className="flex items-center gap-2">
            <TopNav role={user.role} />
            <UserMenu email={user.email} role={user.role} />
          </div>
        </div>
      </header>

      {/* Main content: extra bottom padding on mobile to clear the bottom nav */}
      <main
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:pb-6"
      >
        {children}
      </main>

      {/* Bottom tab bar: visible only on mobile (< md) */}
      <BottomNav role={user.role} />
    </div>
  );
}
