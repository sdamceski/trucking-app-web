'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@prisma/client';

const adminItems = [
  {
    href: '/loads',
    label: 'Loads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13v9H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 10h4l1 3v3h-5" />
        <circle cx="7" cy="17.5" r="1.7" />
        <circle cx="17.5" cy="17.5" r="1.7" />
      </svg>
    ),
  },
  {
    href: '/truckers',
    label: 'Truckers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <circle cx="12" cy="8" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20a7.5 7.5 0 0115 0" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 16V10m4 6V7m4 9v-4" />
      </svg>
    ),
  },
] as const;

const truckerItems = [
  {
    href: '/my',
    label: 'My loads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13v9H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 10h4l1 3v3h-5" />
        <circle cx="7" cy="17.5" r="1.7" />
        <circle cx="17.5" cy="17.5" r="1.7" />
      </svg>
    ),
  },
  {
    href: '/my/payouts',
    label: 'Payouts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <rect x="3" y="6" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === 'admin' ? adminItems : truckerItems;
  const cols = items.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className={`mx-auto grid max-w-md ${cols}`}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  'flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ' +
                  (active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900')
                }
              >
                <span className={active ? 'text-slate-900' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
