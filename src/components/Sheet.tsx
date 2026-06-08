'use client';

import { useEffect, useRef } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Mobile-first dialog: full-screen sheet on small viewports, centered modal on md+.
 * Uses the native <dialog> element so we get the backdrop, focus trap, and ESC
 * dismissal for free.
 */
export default function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="m-0 h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-slate-900/40 md:m-auto md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-xl"
      onClick={(e) => {
        // Click on backdrop (the <dialog> itself, outside its child) closes.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex h-dvh flex-col bg-white md:h-auto md:max-h-[90vh] md:rounded-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer
            className="border-t border-slate-200 bg-white px-4 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
