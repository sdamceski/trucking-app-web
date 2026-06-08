'use client';

import { useRouter } from 'next/navigation';

/**
 * Renders a <tr> that navigates to `href` on click. Supports middle-click and
 * cmd/ctrl-click for "open in new tab" via onAuxClick.
 */
export default function RowLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={(e) => {
        // Ignore clicks on interactive elements inside the row.
        const target = e.target as HTMLElement;
        if (target.closest('a, button, input, select, textarea, label')) return;
        if (e.metaKey || e.ctrlKey) {
          window.open(href, '_blank', 'noopener');
          return;
        }
        router.push(href);
      }}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          window.open(href, '_blank', 'noopener');
        }
      }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
}
