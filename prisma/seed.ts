/**
 * One-shot seed: copies the contents of data/data.json into Postgres.
 * Idempotent — uses upsert keyed by id, so re-running is safe.
 *
 * Run via:  npm run db:seed
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_FILE = path.join(process.cwd(), 'data', 'data.json');

type AnyObj = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function bool(v: unknown): boolean {
  return !!v;
}
function date(v: unknown): Date {
  const s = str(v);
  const d = s ? new Date(s) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const VALID_STATUS = new Set(['new', 'assigned', 'picked_up', 'delivered']);

async function main() {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, 'utf-8');
  } catch {
    console.log('No data/data.json found — nothing to seed.');
    return;
  }
  const parsed = JSON.parse(raw) as {
    truckers?: AnyObj[];
    loads?: AnyObj[];
    payouts?: AnyObj[];
  };

  const truckers = parsed.truckers ?? [];
  const loads = parsed.loads ?? [];
  const payouts = parsed.payouts ?? [];

  console.log(
    `Seeding: ${truckers.length} truckers, ${loads.length} loads, ${payouts.length} payouts`,
  );

  // Order matters: truckers → payouts (depends on trucker) → loads (depends on both).
  for (const t of truckers) {
    const data = {
      id: str(t.id),
      name: str(t.name),
      phone: str(t.phone),
      email: str(t.email),
      truckNumber: str(t.truckNumber),
      notes: str(t.notes),
      commissionPercent: Math.max(0, Math.min(100, num(t.commissionPercent))),
      perLoadFees: (t.perLoadFees ?? []) as Prisma.InputJsonValue,
      recurringFees: (t.recurringFees ?? []) as Prisma.InputJsonValue,
      createdAt: date(t.createdAt),
    };
    await prisma.trucker.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const p of payouts) {
    const data = {
      id: str(p.id),
      truckerId: str(p.truckerId),
      truckerName: str(p.truckerName),
      periodStart: str(p.periodStart),
      periodEnd: str(p.periodEnd),
      notes: str(p.notes),
      loadLines: (p.loadLines ?? []) as Prisma.InputJsonValue,
      recurringLines: (p.recurringLines ?? []) as Prisma.InputJsonValue,
      loadsSubtotal: num(p.loadsSubtotal),
      recurringTotal: num(p.recurringTotal),
      netTotal: num(p.netTotal),
      createdAt: date(p.createdAt),
    };
    await prisma.payout.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const l of loads) {
    const status = VALID_STATUS.has(String(l.status)) ? (l.status as string) : 'new';
    const truckerId = str(l.truckerId) || null;
    const payoutId = str(l.payoutId) || null;
    const data = {
      id: str(l.id),
      status: status as 'new' | 'assigned' | 'picked_up' | 'delivered',
      pickupDate: str(l.pickupDate),
      deliveryDate: str(l.deliveryDate),
      truckerId,
      originCompany: str(l.originCompany),
      originAddress: str(l.originAddress),
      destinationCompany: str(l.destinationCompany),
      destinationAddress: str(l.destinationAddress),
      loadPrice: num(l.loadPrice),
      truckerRate: num(l.truckerRate),
      margin: num(l.margin),
      reference: str(l.reference),
      notes: str(l.notes),
      invoiced: bool(l.invoiced),
      invoicedAt: str(l.invoicedAt),
      invoicedNote: str(l.invoicedNote),
      paid: bool(l.paid),
      cancelled: bool(l.cancelled),
      cancellationReason: str(l.cancellationReason),
      documents: (l.documents ?? []) as Prisma.InputJsonValue,
      payoutSnapshot: (l.payoutSnapshot ?? null) as Prisma.InputJsonValue,
      payoutId,
      createdAt: date(l.createdAt),
    };
    await prisma.load.upsert({ where: { id: data.id }, update: data, create: data });
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
