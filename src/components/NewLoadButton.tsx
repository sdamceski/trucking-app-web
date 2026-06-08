'use client';

import { useRef, useState, useTransition } from 'react';
import Sheet from './Sheet';
import { Field, btnPrimary, btnSecondary, inputCx } from './form';
import AddressAutocomplete from './AddressAutocomplete';
import LoadPricingFields from './LoadPricingFields';
import { createLoad } from '@/lib/actions/loads';
import {
  extractLoadFromDocument,
  type StagedDocument,
} from '@/lib/actions/loadIntake';
import type { Trucker } from '@/lib/types';

type Mode = 'choose' | 'upload' | 'form';

interface Prefill {
  pickupDate: string;
  deliveryDate: string;
  originCompany: string;
  originAddress: string;
  destinationCompany: string;
  destinationAddress: string;
  loadPrice: number;
  reference: string;
  notes: string;
}

const EMPTY_PREFILL: Prefill = {
  pickupDate: '',
  deliveryDate: '',
  originCompany: '',
  originAddress: '',
  destinationCompany: '',
  destinationAddress: '',
  loadPrice: 0,
  reference: '',
  notes: '',
};

export default function NewLoadButton({ truckers }: { truckers: Trucker[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('choose');
  const [staged, setStaged] = useState<StagedDocument | null>(null);
  const [prefill, setPrefill] = useState<Prefill>(EMPTY_PREFILL);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setMode('choose');
    setStaged(null);
    setPrefill(EMPTY_PREFILL);
    setError(null);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setTimeout(reset, 200);
  }

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createLoad(fd);
        setOpen(false);
        reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create load');
      }
    });
  }

  const title =
    mode === 'choose'
      ? 'New load'
      : mode === 'upload'
        ? 'New load from document'
        : staged
          ? `Review extracted load — ${staged.name}`
          : 'New load';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      >
        + New load
      </button>
      <Sheet
        open={open}
        onClose={close}
        title={title}
        footer={
          mode === 'form' ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="new-load-form"
                disabled={pending}
                className={btnPrimary}
              >
                {pending ? 'Creating…' : 'Create load'}
              </button>
            </div>
          ) : null
        }
      >
        {mode === 'choose' && (
          <ChooseStep
            onManual={() => {
              setPrefill(EMPTY_PREFILL);
              setStaged(null);
              setMode('form');
            }}
            onFromDocument={() => setMode('upload')}
          />
        )}
        {mode === 'upload' && (
          <UploadStep
            onBack={() => setMode('choose')}
            onExtracted={(result) => {
              setStaged(result.staged);
              setPrefill(result.fields);
              setMode('form');
            }}
          />
        )}
        {mode === 'form' && (
          <FormStep
            truckers={truckers}
            prefill={prefill}
            staged={staged}
            onSubmit={onSubmit}
            error={error}
          />
        )}
      </Sheet>
    </>
  );
}

function ChooseStep({
  onManual,
  onFromDocument,
}: {
  onManual: () => void;
  onFromDocument: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">How would you like to create this load?</p>
      <button
        type="button"
        onClick={onFromDocument}
        className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
      >
        <span className="text-2xl">📄</span>
        <span>
          <span className="block font-medium text-slate-900">From rate confirmation</span>
          <span className="mt-0.5 block text-sm text-slate-500">
            Upload a PDF or image; we&apos;ll OCR it and pre-fill the load.
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onManual}
        className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
      >
        <span className="text-2xl">✍️</span>
        <span>
          <span className="block font-medium text-slate-900">Enter manually</span>
          <span className="mt-0.5 block text-sm text-slate-500">
            Type or paste load details into the form.
          </span>
        </span>
      </button>
    </div>
  );
}

function UploadStep({
  onBack,
  onExtracted,
}: {
  onBack: () => void;
  onExtracted: (r: Awaited<ReturnType<typeof extractLoadFromDocument>>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFile(e.target.files?.[0] ?? null);
  }

  function onExtract() {
    if (!file) {
      setError('Choose a file first');
      return;
    }
    setError(null);
    start(async () => {
      try {
        const fd = new FormData();
        fd.set('file', file);
        const result = await extractLoadFromDocument(fd);
        onExtracted(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Extraction failed');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">
          Upload a rate confirmation (PDF or image, up to 15 MB).
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <label className={btnSecondary + ' cursor-pointer'}>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={onPick}
              disabled={pending}
            />
            {file ? 'Choose different file' : 'Choose file'}
          </label>
        </div>
        {file && (
          <p className="mt-3 truncate text-sm font-medium text-slate-700">{file.name}</p>
        )}
      </div>

      {pending && (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Running OCR and extracting fields… this can take 10–20 seconds.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className={btnSecondary}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onExtract}
          disabled={pending || !file}
          className={btnPrimary}
        >
          {pending ? 'Extracting…' : 'Extract & continue'}
        </button>
      </div>
    </div>
  );
}

function FormStep({
  truckers,
  prefill,
  staged,
  onSubmit,
  error,
}: {
  truckers: Trucker[];
  prefill: Prefill;
  staged: StagedDocument | null;
  onSubmit: (fd: FormData) => void;
  error: string | null;
}) {
  return (
    <form id="new-load-form" action={onSubmit} className="space-y-4">
      {staged && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Pre-filled from <span className="font-medium">{staged.name}</span>. Please
          review every field before creating. The file will be attached as a rate
          confirmation.
        </div>
      )}

      {staged && (
        <>
          <input type="hidden" name="stagingKey" value={staged.stagingKey} />
          <input type="hidden" name="stagedDocId" value={staged.docId} />
          <input type="hidden" name="stagedName" value={staged.name} />
          <input type="hidden" name="stagedMime" value={staged.mimeType} />
          <input type="hidden" name="stagedSize" value={staged.size} />
        </>
      )}

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <Field
          label="Assign trucker (optional)"
          hint="You can leave this empty and assign later from the load detail page."
        >
          <select name="truckerId" className={inputCx} defaultValue="">
            <option value="">— unassigned —</option>
            {truckers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.truckNumber ? ` · Truck ${t.truckNumber}` : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pickup date">
          <input
            name="pickupDate"
            type="date"
            required
            defaultValue={prefill.pickupDate}
            className={inputCx}
          />
        </Field>
        <Field label="Delivery date">
          <input
            name="deliveryDate"
            type="date"
            defaultValue={prefill.deliveryDate}
            className={inputCx}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Origin company">
          <input
            name="originCompany"
            type="text"
            defaultValue={prefill.originCompany}
            className={inputCx}
          />
        </Field>
        <Field label="Origin address">
          <AddressAutocomplete name="originAddress" defaultValue={prefill.originAddress} />
        </Field>
        <Field label="Destination company">
          <input
            name="destinationCompany"
            type="text"
            defaultValue={prefill.destinationCompany}
            className={inputCx}
          />
        </Field>
        <Field label="Destination address">
          <AddressAutocomplete
            name="destinationAddress"
            defaultValue={prefill.destinationAddress}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LoadPricingFields defaultLoadPrice={prefill.loadPrice} defaultTruckerRate={0} />
        <Field label="Reference">
          <input
            name="reference"
            type="text"
            defaultValue={prefill.reference}
            className={inputCx}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={3}
          defaultValue={prefill.notes}
          className={inputCx}
        />
      </Field>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
