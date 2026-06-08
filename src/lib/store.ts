import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DataFile,
  DOC_CATEGORIES,
  Load,
  LOAD_FLAGS,
  LOAD_STATUSES,
  LoadDocument,
  LoadStatus,
  PerLoadFee,
  RECURRING_FREQUENCIES,
  RecurringFee,
  Trucker,
  VALID_FEE_TYPE,
} from './types';
import { newId } from './ids';
import { makePayoutSnapshot } from './financials';

const DATA_FILE = path.join(process.cwd(), 'data', 'data.json');

const VALID_STATUS = new Set<LoadStatus>(LOAD_STATUSES);

function defaultStatus(load: Pick<Load, 'truckerId'>): LoadStatus {
  return load.truckerId ? 'assigned' : 'new';
}

function migrateLoad(raw: Partial<Load> & Record<string, unknown>): Load {
  let status = raw.status as string | undefined;
  let invoiced = !!raw.invoiced;
  let paid = !!raw.paid;
  let cancelled = !!raw.cancelled;
  if (status === 'in_transit') status = 'picked_up';
  else if (status === 'invoiced') {
    status = 'delivered';
    invoiced = true;
  } else if (status === 'paid') {
    status = 'delivered';
    invoiced = true;
    paid = true;
  } else if (status === 'cancelled') {
    status = defaultStatus({ truckerId: String(raw.truckerId ?? '') });
    cancelled = true;
  }
  if (!status || !VALID_STATUS.has(status as LoadStatus)) {
    status = defaultStatus({ truckerId: String(raw.truckerId ?? '') });
  }
  return {
    id: String(raw.id ?? newId('LOAD')),
    status: status as LoadStatus,
    pickupDate: str(raw.pickupDate),
    deliveryDate: str(raw.deliveryDate),
    truckerId: str(raw.truckerId),
    originCompany: str(raw.originCompany),
    originAddress: str(raw.originAddress),
    destinationCompany: str(raw.destinationCompany),
    destinationAddress: str(raw.destinationAddress),
    loadPrice: num(raw.loadPrice),
    truckerRate: num(raw.truckerRate),
    margin: num(raw.margin),
    reference: str(raw.reference),
    notes: str(raw.notes),
    invoiced,
    paid,
    cancelled,
    cancellationReason: str(raw.cancellationReason),
    documents: Array.isArray(raw.documents) ? (raw.documents as LoadDocument[]) : [],
    payoutSnapshot:
      raw.payoutSnapshot && typeof raw.payoutSnapshot === 'object'
        ? (raw.payoutSnapshot as Load['payoutSnapshot'])
        : null,
    createdAt: str(raw.createdAt) || new Date().toISOString(),
  };
}

function normalizeFee(
  raw: Partial<RecurringFee> & Record<string, unknown>,
  recurring: boolean,
): PerLoadFee | RecurringFee {
  const type = VALID_FEE_TYPE.has(raw.type as PerLoadFee['type'])
    ? (raw.type as PerLoadFee['type'])
    : 'fixed';
  const base: PerLoadFee = {
    id: String(raw.id ?? newId('FEE')),
    name: str(raw.name),
    type,
    amount: num(raw.amount),
  };
  if (!recurring) return base;
  const frequency = (RECURRING_FREQUENCIES as readonly string[]).includes(String(raw.frequency))
    ? (raw.frequency as RecurringFee['frequency'])
    : 'monthly';
  return { ...base, frequency };
}

function normalizeTrucker(raw: Partial<Trucker> & Record<string, unknown>): Trucker {
  const commission = num(raw.commissionPercent);
  return {
    id: String(raw.id ?? newId('TRK')),
    name: str(raw.name),
    phone: str(raw.phone),
    email: str(raw.email),
    truckNumber: str(raw.truckNumber),
    notes: str(raw.notes),
    createdAt: str(raw.createdAt) || new Date().toISOString(),
    commissionPercent: Math.max(0, Math.min(100, commission)),
    perLoadFees: Array.isArray(raw.perLoadFees)
      ? (raw.perLoadFees.map((f) =>
          normalizeFee(f as Partial<RecurringFee>, false),
        ) as PerLoadFee[])
      : [],
    recurringFees: Array.isArray(raw.recurringFees)
      ? (raw.recurringFees.map((f) =>
          normalizeFee(f as Partial<RecurringFee>, true),
        ) as RecurringFee[])
      : [],
  };
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function readFile(): Promise<DataFile> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DataFile>;
    return {
      truckers: Array.isArray(parsed.truckers)
        ? parsed.truckers.map((t) =>
            normalizeTrucker(t as Partial<Trucker> & Record<string, unknown>),
          )
        : [],
      loads: Array.isArray(parsed.loads)
        ? parsed.loads.map((l) => migrateLoad(l as Partial<Load> & Record<string, unknown>))
        : [],
    };
  } catch {
    return { truckers: [], loads: [] };
  }
}

async function writeFile(data: DataFile): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// Reads
// ============================================================================

export async function getTruckers(): Promise<Trucker[]> {
  return (await readFile()).truckers;
}

export async function getTrucker(id: string): Promise<Trucker | null> {
  const data = await readFile();
  return data.truckers.find((t) => t.id === id) ?? null;
}

export async function getLoads(): Promise<Load[]> {
  return (await readFile()).loads;
}

export async function getLoad(id: string): Promise<Load | null> {
  const data = await readFile();
  return data.loads.find((l) => l.id === id) ?? null;
}

export async function getData(): Promise<DataFile> {
  return readFile();
}

// ============================================================================
// Trucker mutations
// ============================================================================

export type TruckerInput = Partial<Omit<Trucker, 'id' | 'createdAt'>>;

export async function createTrucker(input: TruckerInput): Promise<Trucker> {
  const data = await readFile();
  const t = normalizeTrucker({
    ...input,
    id: newId('TRK'),
    createdAt: new Date().toISOString(),
  });
  data.truckers.push(t);
  await writeFile(data);
  return t;
}

export async function updateTrucker(id: string, input: TruckerInput): Promise<Trucker | null> {
  const data = await readFile();
  const idx = data.truckers.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const merged = normalizeTrucker({ ...data.truckers[idx], ...input, id });
  data.truckers[idx] = merged;
  await writeFile(data);
  return merged;
}

export async function deleteTrucker(id: string): Promise<boolean> {
  const data = await readFile();
  const before = data.truckers.length;
  data.truckers = data.truckers.filter((t) => t.id !== id);
  if (data.truckers.length === before) return false;
  data.loads = data.loads.map((l) => (l.truckerId === id ? { ...l, truckerId: '' } : l));
  await writeFile(data);
  return true;
}

// ============================================================================
// Load mutations
// ============================================================================

export type LoadInput = Partial<
  Omit<Load, 'id' | 'createdAt' | 'documents' | 'payoutSnapshot' | 'margin'>
>;

export async function createLoad(input: LoadInput): Promise<Load> {
  const data = await readFile();
  const truckerId = str(input.truckerId);
  const trucker = truckerId ? data.truckers.find((t) => t.id === truckerId) : undefined;
  const loadPrice = num(input.loadPrice);
  const truckerRate = num(input.truckerRate);
  const status = (
    input.status && VALID_STATUS.has(input.status)
      ? input.status
      : defaultStatus({ truckerId })
  ) as LoadStatus;
  const load: Load = {
    id: newId('LOAD'),
    status,
    pickupDate: str(input.pickupDate),
    deliveryDate: str(input.deliveryDate),
    truckerId,
    originCompany: str(input.originCompany),
    originAddress: str(input.originAddress),
    destinationCompany: str(input.destinationCompany),
    destinationAddress: str(input.destinationAddress),
    loadPrice,
    truckerRate,
    margin: +(loadPrice - truckerRate).toFixed(2),
    reference: str(input.reference),
    notes: str(input.notes),
    invoiced: !!input.invoiced,
    paid: !!input.paid,
    cancelled: !!input.cancelled,
    cancellationReason: str(input.cancellationReason),
    documents: [],
    payoutSnapshot: trucker ? makePayoutSnapshot(normalizeTrucker(trucker)) : null,
    createdAt: new Date().toISOString(),
  };
  data.loads.push(load);
  await writeFile(data);
  return load;
}

export async function updateLoad(id: string, input: LoadInput): Promise<Load | null> {
  const data = await readFile();
  const idx = data.loads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const cur = data.loads[idx];
  const next: Load = { ...cur };

  const stringFields: (keyof Load)[] = [
    'pickupDate',
    'deliveryDate',
    'truckerId',
    'originCompany',
    'originAddress',
    'destinationCompany',
    'destinationAddress',
    'reference',
    'notes',
    'cancellationReason',
  ];
  for (const f of stringFields) {
    if (input[f] !== undefined) (next as Record<string, unknown>)[f] = str(input[f]);
  }
  if (input.loadPrice !== undefined) next.loadPrice = num(input.loadPrice);
  if (input.truckerRate !== undefined) next.truckerRate = num(input.truckerRate);
  next.margin = +(next.loadPrice - next.truckerRate).toFixed(2);

  for (const flag of LOAD_FLAGS) {
    if (input[flag] !== undefined) next[flag] = !!input[flag];
  }
  if (input.cancelled !== undefined && !next.cancelled) next.cancellationReason = '';

  if (input.status !== undefined && VALID_STATUS.has(input.status)) {
    next.status = input.status;
  } else if (!cur.truckerId && next.truckerId && cur.status === 'new') {
    next.status = 'assigned';
  }
  if (
    cur.truckerId &&
    !next.truckerId &&
    next.status === 'assigned' &&
    input.status === undefined
  ) {
    next.status = 'new';
  }

  if (cur.truckerId !== next.truckerId) {
    if (next.truckerId) {
      const t = data.truckers.find((x) => x.id === next.truckerId);
      next.payoutSnapshot = t ? makePayoutSnapshot(normalizeTrucker(t)) : null;
    } else {
      next.payoutSnapshot = null;
    }
  }

  data.loads[idx] = next;
  await writeFile(data);
  return next;
}

export async function deleteLoad(id: string): Promise<boolean> {
  const data = await readFile();
  const before = data.loads.length;
  data.loads = data.loads.filter((l) => l.id !== id);
  if (data.loads.length === before) return false;
  await writeFile(data);
  return true;
}

export { DOC_CATEGORIES, LOAD_FLAGS, LOAD_STATUSES, RECURRING_FREQUENCIES };
