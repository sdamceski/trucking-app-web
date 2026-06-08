export const LOAD_STATUSES = ['new', 'assigned', 'picked_up', 'delivered'] as const;
export type LoadStatus = (typeof LOAD_STATUSES)[number];

export const LOAD_FLAGS = ['invoiced', 'paid', 'cancelled'] as const;
export type LoadFlag = (typeof LOAD_FLAGS)[number];

export const FEE_TYPES = ['fixed', 'percent'] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const RECURRING_FREQUENCIES = [
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const DOC_CATEGORIES = [
  'rateConfirmation',
  'deliveryConfirmation',
  'other',
] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export interface PerLoadFee {
  id: string;
  name: string;
  type: FeeType;
  amount: number;
}

export interface RecurringFee extends PerLoadFee {
  frequency: RecurringFrequency;
}

export interface Trucker {
  id: string;
  name: string;
  phone: string;
  email: string;
  truckNumber: string;
  notes: string;
  createdAt: string;
  commissionPercent: number;
  perLoadFees: PerLoadFee[];
  recurringFees: RecurringFee[];
}

export interface LoadDocument {
  id: string;
  category: DocCategory;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface PayoutSnapshot {
  truckerId: string;
  commissionPercent: number;
  perLoadFees: PerLoadFee[];
  capturedAt: string;
}

export interface Load {
  id: string;
  status: LoadStatus;
  pickupDate: string;
  deliveryDate: string;
  truckerId: string;
  originCompany: string;
  originAddress: string;
  destinationCompany: string;
  destinationAddress: string;
  loadPrice: number;
  truckerRate: number;
  margin: number;
  reference: string;
  notes: string;
  invoiced: boolean;
  paid: boolean;
  cancelled: boolean;
  cancellationReason: string;
  documents: LoadDocument[];
  payoutSnapshot: PayoutSnapshot | null;
  createdAt: string;
}

export interface FeeBreakdownLine {
  source: 'commission' | 'perLoadFee';
  name: string;
  amount: number;
}

export interface LoadFinancials {
  base: number;
  commissionPercent: number;
  commissionAmount: number;
  feeBreakdown: FeeBreakdownLine[];
  feesTotal: number;
  truckerPayout: number;
  companyMargin: number;
}

export interface DataFile {
  truckers: Trucker[];
  loads: Load[];
}
