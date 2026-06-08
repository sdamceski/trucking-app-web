'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/loads', label: 'Loads' },
  { href: '/truckers', label: 'Truckers' },
  { href: '/reports', label: 'Reports' },
] as const;

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
