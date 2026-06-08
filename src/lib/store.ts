import {
  DOC_CATEGORIES,
  DataFile,
  LOAD_FLAGS,
  LOAD_STATUSES,
  Load,
  LoadStatus,
  Payout,
  PayoutLoadLine,
  PayoutRecurringLine,
  PerLoadFee,
  RECURRING_FREQUENCIES,
  RecurringFee,
  Trucker,
  VALID_FEE_TYPE,
} from './types';
import { newId } from './ids';
import { computeLoadFinancials, makePayoutSnapshot } from './financials';
import { prisma } from './prisma';
import type {
  Load as DbLoad,
  Payout as DbPayout,
  Trucker as DbTrucker,
} from '@prisma/client';

const VALID_STATUS = new Set<LoadStatus>(LOAD_STATUSES);

function defaultStatus(load: Pick<Load, 'truckerId'>): LoadStatus {
  return load.truckerId ? 'assigned' : 'new';
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ============================================================================
// DB → domain mappers
// ============================================================================

function mapTrucker(t: DbTrucker): Trucker {
  const perLoadFees = Array.isArray(t.perLoadFees)
    ? (t.perLoadFees as unknown[]).map(
        (f) => normalizeFee(f as Record<string, unknown>, false) as PerLoadFee,
      )
    : [];
  const recurringFees = Array.isArray(t.recurringFees)
    ? (t.recurringFees as unknown[]).map(
        (f) => normalizeFee(f as Record<string, unknown>, true) as RecurringFee,
      )
    : [];
  return {
    id: t.id,
    name: t.name,
    phone: t.phone,
    email: t.email,
    truckNumber: t.truckNumber,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
    commissionPercent: t.commissionPercent,
    perLoadFees,
    recurringFees,
  };
}

function mapLoad(l: DbLoad): Load {
  return {
    id: l.id,
    status: l.status as LoadStatus,
    pickupDate: l.pickupDate,
    deliveryDate: l.deliveryDate,
    pickedUpAt: l.pickedUpAt,
    deliveredAt: l.deliveredAt,
    truckerId: l.truckerId ?? '',
    originCompany: l.originCompany,
    originAddress: l.originAddress,
    destinationCompany: l.destinationCompany,
    destinationAddress: l.destinationAddress,
    loadPrice: l.loadPrice,
    truckerRate: l.truckerRate,
    margin: l.margin,
    reference: l.reference,
    notes: l.notes,
    invoiced: l.invoiced,
    invoicedAt: l.invoicedAt,
    invoicedNote: l.invoicedNote,
    paid: l.paid,
    cancelled: l.cancelled,
    cancellationReason: l.cancellationReason,
    documents: Array.isArray(l.documents) ? (l.documents as unknown as Load['documents']) : [],
    payoutSnapshot: (l.payoutSnapshot as unknown as Load['payoutSnapshot']) ?? null,
    payoutId: l.payoutId ?? '',
    createdAt: l.createdAt.toISOString(),
  };
}

function mapPayout(p: DbPayout): Payout {
  const loadLines = Array.isArray(p.loadLines)
    ? (p.loadLines as unknown[]).map((line) => {
        const l = line as Record<string, unknown>;
        return {
          loadId: str(l.loadId),
          loadRef: str(l.loadRef),
          base: num(l.base),
          commissionPercent: num(l.commissionPercent),
          commissionAmount: num(l.commissionAmount),
          feeBreakdown: Array.isArray(l.feeBreakdown)
            ? (l.feeBreakdown as PayoutLoadLine['feeBreakdown'])
            : [],
          feesTotal: num(l.feesTotal),
          truckerPayout: num(l.truckerPayout),
        } as PayoutLoadLine;
      })
    : [];
  const recurringLines = Array.isArray(p.recurringLines)
    ? (p.recurringLines as unknown[]).map((line) => {
        const l = line as Record<string, unknown>;
        return {
          feeId: str(l.feeId),
          name: str(l.name),
          frequency: (l.frequency as PayoutRecurringLine['frequency']) ?? 'monthly',
          type: (l.type as PayoutRecurringLine['type']) ?? 'fixed',
          amount: num(l.amount),
        } as PayoutRecurringLine;
      })
    : [];
  return {
    id: p.id,
    truckerId: p.truckerId,
    truckerName: p.truckerName,
    createdAt: p.createdAt.toISOString(),
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    notes: p.notes,
    loadLines,
    recurringLines,
    loadsSubtotal: p.loadsSubtotal,
    recurringTotal: p.recurringTotal,
    netTotal: p.netTotal,
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

// ============================================================================
// Reads
// ============================================================================

export async function getTruckers(): Promise<Trucker[]> {
  const rows = await prisma.trucker.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapTrucker);
}

export async function getTrucker(id: string): Promise<Trucker | null> {
  const t = await prisma.trucker.findUnique({ where: { id } });
  return t ? mapTrucker(t) : null;
}

export async function getLoads(): Promise<Load[]> {
  const rows = await prisma.load.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapLoad);
}

export async function getLoad(id: string): Promise<Load | null> {
  const l = await prisma.load.findUnique({ where: { id } });
  return l ? mapLoad(l) : null;
}

export async function getData(): Promise<DataFile> {
  const [truckers, loads, payouts] = await Promise.all([
    getTruckers(),
    getLoads(),
    getPayouts(),
  ]);
  return { truckers, loads, payouts };
}

// ============================================================================
// Trucker mutations
// ============================================================================

export type TruckerInput = Partial<Omit<Trucker, 'id' | 'createdAt'>>;

export async function createTrucker(input: TruckerInput): Promise<Trucker> {
  const t = await prisma.trucker.create({
    data: {
      id: newId('TRK'),
      name: str(input.name),
      phone: str(input.phone),
      email: str(input.email),
      truckNumber: str(input.truckNumber),
      notes: str(input.notes),
      commissionPercent: Math.max(0, Math.min(100, num(input.commissionPercent))),
      perLoadFees: (input.perLoadFees ?? []).map((f) => normalizeFee(f, false)),
      recurringFees: (input.recurringFees ?? []).map((f) => normalizeFee(f, true)),
    },
  });
  return mapTrucker(t);
}

export async function updateTrucker(id: string, input: TruckerInput): Promise<Trucker | null> {
  const existing = await prisma.trucker.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = str(input.name);
  if (input.phone !== undefined) data.phone = str(input.phone);
  if (input.email !== undefined) data.email = str(input.email);
  if (input.truckNumber !== undefined) data.truckNumber = str(input.truckNumber);
  if (input.notes !== undefined) data.notes = str(input.notes);
  if (input.commissionPercent !== undefined) {
    data.commissionPercent = Math.max(0, Math.min(100, num(input.commissionPercent)));
  }
  if (input.perLoadFees !== undefined) {
    data.perLoadFees = input.perLoadFees.map((f) => normalizeFee(f, false));
  }
  if (input.recurringFees !== undefined) {
    data.recurringFees = input.recurringFees.map((f) => normalizeFee(f, true));
  }

  const t = await prisma.trucker.update({ where: { id }, data });
  return mapTrucker(t);
}

export async function deleteTrucker(id: string): Promise<boolean> {
  try {
    // Loads.truckerId has onDelete: SetNull, so loads survive with truckerId=null.
    // Payouts.truckerId has onDelete: Cascade — payouts for this trucker are removed.
    await prisma.trucker.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Load mutations
// ============================================================================

export type LoadInput = Partial<
  Omit<Load, 'id' | 'createdAt' | 'documents' | 'payoutSnapshot' | 'margin'>
>;

export async function createLoad(input: LoadInput): Promise<Load> {
  const truckerId = str(input.truckerId);
  const trucker = truckerId
    ? await prisma.trucker.findUnique({ where: { id: truckerId } })
    : null;
  const loadPrice = num(input.loadPrice);
  const truckerRate = num(input.truckerRate);
  const status = (
    input.status && VALID_STATUS.has(input.status)
      ? input.status
      : defaultStatus({ truckerId })
  ) as LoadStatus;

  const snapshot = trucker ? makePayoutSnapshot(mapTrucker(trucker)) : null;

  const l = await prisma.load.create({
    data: {
      id: newId('LOAD'),
      status,
      pickupDate: str(input.pickupDate),
      deliveryDate: str(input.deliveryDate),
      truckerId: truckerId || null,
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
      invoicedAt: str(input.invoicedAt),
      invoicedNote: str(input.invoicedNote),
      paid: !!input.paid,
      cancelled: !!input.cancelled,
      cancellationReason: str(input.cancellationReason),
      documents: [],
      payoutSnapshot: snapshot ?? undefined,
    },
  });
  return mapLoad(l);
}

export async function updateLoad(id: string, input: LoadInput): Promise<Load | null> {
  const cur = await prisma.load.findUnique({ where: { id } });
  if (!cur) return null;

  const data: Record<string, unknown> = {};

  if (input.pickupDate !== undefined) data.pickupDate = str(input.pickupDate);
  if (input.deliveryDate !== undefined) data.deliveryDate = str(input.deliveryDate);
  if (input.pickedUpAt !== undefined) data.pickedUpAt = str(input.pickedUpAt);
  if (input.deliveredAt !== undefined) data.deliveredAt = str(input.deliveredAt);
  if (input.originCompany !== undefined) data.originCompany = str(input.originCompany);
  if (input.originAddress !== undefined) data.originAddress = str(input.originAddress);
  if (input.destinationCompany !== undefined) {
    data.destinationCompany = str(input.destinationCompany);
  }
  if (input.destinationAddress !== undefined) {
    data.destinationAddress = str(input.destinationAddress);
  }
  if (input.reference !== undefined) data.reference = str(input.reference);
  if (input.notes !== undefined) data.notes = str(input.notes);
  if (input.cancellationReason !== undefined) {
    data.cancellationReason = str(input.cancellationReason);
  }
  if (input.invoicedAt !== undefined) data.invoicedAt = str(input.invoicedAt);
  if (input.invoicedNote !== undefined) data.invoicedNote = str(input.invoicedNote);

  const nextPrice = input.loadPrice !== undefined ? num(input.loadPrice) : cur.loadPrice;
  const nextRate = input.truckerRate !== undefined ? num(input.truckerRate) : cur.truckerRate;
  if (input.loadPrice !== undefined) data.loadPrice = nextPrice;
  if (input.truckerRate !== undefined) data.truckerRate = nextRate;
  data.margin = +(nextPrice - nextRate).toFixed(2);

  for (const flag of LOAD_FLAGS) {
    if (input[flag] !== undefined) data[flag] = !!input[flag];
  }
  if (input.cancelled !== undefined && !data.cancelled) data.cancellationReason = '';
  if (input.invoiced === false) {
    data.invoicedAt = '';
    data.invoicedNote = '';
  }

  // Trucker reassignment + status auto-advance
  let nextTruckerId: string | null | undefined;
  if (input.truckerId !== undefined) {
    nextTruckerId = str(input.truckerId) || null;
    data.truckerId = nextTruckerId;
  }
  let nextStatus: LoadStatus = cur.status as LoadStatus;
  if (input.status !== undefined && VALID_STATUS.has(input.status)) {
    nextStatus = input.status;
    data.status = nextStatus;
  } else if (!cur.truckerId && nextTruckerId && cur.status === 'new') {
    nextStatus = 'assigned';
    data.status = nextStatus;
  } else if (
    cur.truckerId &&
    nextTruckerId === null &&
    cur.status === 'assigned' &&
    input.status === undefined
  ) {
    nextStatus = 'new';
    data.status = nextStatus;
  }

  // Recapture payout snapshot if trucker changed
  if (input.truckerId !== undefined && (cur.truckerId ?? '') !== (nextTruckerId ?? '')) {
    if (nextTruckerId) {
      const t = await prisma.trucker.findUnique({ where: { id: nextTruckerId } });
      data.payoutSnapshot = t ? makePayoutSnapshot(mapTrucker(t)) : undefined;
    } else {
      data.payoutSnapshot = undefined;
    }
  }

  const updated = await prisma.load.update({ where: { id }, data });
  return mapLoad(updated);
}

export async function deleteLoad(id: string): Promise<boolean> {
  try {
    await prisma.load.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Payouts
// ============================================================================

export async function getPayouts(): Promise<Payout[]> {
  const rows = await prisma.payout.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapPayout);
}

export async function getPayoutsByTrucker(truckerId: string): Promise<Payout[]> {
  const rows = await prisma.payout.findMany({
    where: { truckerId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapPayout);
}

export async function getPayout(id: string): Promise<Payout | null> {
  const p = await prisma.payout.findUnique({ where: { id } });
  return p ? mapPayout(p) : null;
}

export interface CreatePayoutInput {
  truckerId: string;
  loadIds: string[];
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  recurringFees?: { feeId: string; amount: number }[];
}

export async function createPayout(input: CreatePayoutInput): Promise<Payout | null> {
  const truckerRow = await prisma.trucker.findUnique({ where: { id: input.truckerId } });
  if (!truckerRow) return null;
  const trucker = mapTrucker(truckerRow);

  const eligibleLoads = await prisma.load.findMany({
    where: { truckerId: trucker.id, payoutId: null, cancelled: false },
  });
  const eligibleIds = new Set(eligibleLoads.map((l) => l.id));
  const picked = input.loadIds.filter((id) => eligibleIds.has(id));
  if (picked.length === 0 && (input.recurringFees ?? []).length === 0) {
    return null;
  }

  const loadLines: PayoutLoadLine[] = picked.map((id) => {
    const dbLoad = eligibleLoads.find((l) => l.id === id)!;
    const load = mapLoad(dbLoad);
    const fin = computeLoadFinancials(load, trucker);
    return {
      loadId: load.id,
      loadRef: load.reference || load.id,
      base: fin.base,
      commissionPercent: fin.commissionPercent,
      commissionAmount: fin.commissionAmount,
      feeBreakdown: fin.feeBreakdown,
      feesTotal: fin.feesTotal,
      truckerPayout: fin.truckerPayout,
    };
  });

  const recurringLines: PayoutRecurringLine[] = (input.recurringFees ?? [])
    .map((r) => {
      const fee = trucker.recurringFees.find((f) => f.id === r.feeId);
      if (!fee) return null;
      const amount = +(Number.isFinite(r.amount) ? r.amount : fee.amount).toFixed(2);
      return {
        feeId: fee.id,
        name: fee.name,
        frequency: fee.frequency,
        type: fee.type,
        amount,
      };
    })
    .filter((x): x is PayoutRecurringLine => x !== null && x.amount > 0);

  const loadsSubtotal = +loadLines.reduce((s, l) => s + l.truckerPayout, 0).toFixed(2);
  const recurringTotal = +recurringLines.reduce((s, l) => s + l.amount, 0).toFixed(2);
  const netTotal = +(loadsSubtotal - recurringTotal).toFixed(2);

  const payoutId = newId('PAY');
  const [created] = await prisma.$transaction([
    prisma.payout.create({
      data: {
        id: payoutId,
        truckerId: trucker.id,
        truckerName: trucker.name,
        periodStart: str(input.periodStart),
        periodEnd: str(input.periodEnd),
        notes: str(input.notes),
        loadLines: loadLines as unknown as object,
        recurringLines: recurringLines as unknown as object,
        loadsSubtotal,
        recurringTotal,
        netTotal,
      },
    }),
    prisma.load.updateMany({
      where: { id: { in: picked } },
      data: { payoutId, paid: true },
    }),
  ]);

  return mapPayout(created);
}

export async function voidPayout(id: string): Promise<boolean> {
  const payout = await prisma.payout.findUnique({ where: { id } });
  if (!payout) return false;
  const loadIds = Array.isArray(payout.loadLines)
    ? (payout.loadLines as unknown[])
        .map((l) => str((l as Record<string, unknown>).loadId))
        .filter(Boolean)
    : [];
  await prisma.$transaction([
    prisma.load.updateMany({
      where: { id: { in: loadIds } },
      data: { payoutId: null, paid: false },
    }),
    prisma.payout.delete({ where: { id } }),
  ]);
  return true;
}

export { DOC_CATEGORIES, LOAD_FLAGS, LOAD_STATUSES, RECURRING_FREQUENCIES };
