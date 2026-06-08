'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { DOC_CATEGORIES, type DocCategory, type LoadDocument } from '@/lib/types';
import {
  deleteLoadDocument,
  getLoadDocumentDownloadUrl,
  getLoadDocumentViewUrl,
  uploadLoadDocument,
} from '@/lib/actions/documents';
import { btnDanger, btnSecondary } from './form';

const CATEGORY_LABEL: Record<DocCategory, string> = {
  rateConfirmation: 'Rate confirmation',
  deliveryConfirmation: 'Delivery confirmation / BOL',
  other: 'Other',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ViewerState {
  url: string;
  mimeType: string;
  name: string;
}

export default function LoadDocuments({
  loadId,
  documents,
}: {
  loadId: string;
  documents: LoadDocument[];
}) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  return (
    <div className="space-y-5">
      {DOC_CATEGORIES.map((cat) => (
        <CategorySection
          key={cat}
          loadId={loadId}
          category={cat}
          docs={documents.filter((d) => d.category === cat)}
          onView={setViewer}
        />
      ))}
      {viewer && <ViewerModal viewer={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}

function CategorySection({
  loadId,
  category,
  docs,
  onView,
}: {
  loadId: string;
  category: DocCategory;
  docs: LoadDocument[];
  onView: (v: ViewerState) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('category', category);
    start(async () => {
      try {
        await uploadLoadDocument(loadId, fd);
        if (inputRef.current) inputRef.current.value = '';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        if (inputRef.current) inputRef.current.value = '';
      }
    });
  }

  return (
    <div className="rounded-md border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <div className="text-sm font-medium text-slate-800">
          {CATEGORY_LABEL[category]}
          <span className="ml-2 text-xs font-normal text-slate-400">
            {docs.length} {docs.length === 1 ? 'file' : 'files'}
          </span>
        </div>
        <label className={btnSecondary + ' cursor-pointer'}>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={onPick}
            disabled={pending}
          />
          {pending ? 'Uploading…' : '+ Upload'}
        </label>
      </div>
      {error && (
        <p className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {docs.length === 0 ? (
        <p className="px-3 py-4 text-sm text-slate-400">No files yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => (
            <DocRow key={d.id} loadId={loadId} doc={d} onView={onView} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocRow({
  loadId,
  doc,
  onView,
}: {
  loadId: string;
  doc: LoadDocument;
  onView: (v: ViewerState) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const viewable =
    doc.mimeType === 'application/pdf' || doc.mimeType.startsWith('image/');

  function onViewClick() {
    setError(null);
    start(async () => {
      try {
        const v = await getLoadDocumentViewUrl(loadId, doc.id);
        onView(v);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Preview failed');
      }
    });
  }

  function onDownload() {
    setError(null);
    start(async () => {
      try {
        const url = await getLoadDocumentDownloadUrl(loadId, doc.id);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    setError(null);
    start(async () => {
      try {
        await deleteLoadDocument(loadId, doc.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800">{doc.name}</div>
        <div className="text-xs text-slate-500">
          {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleString()}
        </div>
        {error && <div className="text-xs text-rose-700">{error}</div>}
      </div>
      {viewable && (
        <button
          type="button"
          onClick={onViewClick}
          disabled={pending}
          className={btnSecondary + ' !px-3 !py-1 text-xs'}
        >
          {pending ? '…' : 'View'}
        </button>
      )}
      <button
        type="button"
        onClick={onDownload}
        disabled={pending}
        className={btnSecondary + ' !px-3 !py-1 text-xs'}
      >
        Download
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className={btnDanger + ' !px-3 !py-1 text-xs'}
      >
        Delete
      </button>
    </li>
  );
}

function ViewerModal({
  viewer,
  onClose,
}: {
  viewer: ViewerState;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => {
      el.removeEventListener('cancel', onCancel);
      if (el.open) el.close();
    };
  }, [onClose]);

  const isImage = viewer.mimeType.startsWith('image/');

  return (
    <dialog
      ref={ref}
      className="m-0 h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-slate-900/60 md:m-auto md:h-[92vh] md:max-h-[92vh] md:w-[92vw] md:max-w-6xl md:rounded-xl"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex h-dvh flex-col bg-white md:h-[92vh] md:rounded-xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="truncate text-base font-semibold">{viewer.name}</h2>
          <div className="flex items-center gap-2">
            <a
              href={viewer.url}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondary + ' !px-3 !py-1 text-xs'}
            >
              Open in new tab
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-slate-100">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewer.url}
              alt={viewer.name}
              className="mx-auto block max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <iframe
              src={viewer.url}
              title={viewer.name}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </dialog>
  );
}
