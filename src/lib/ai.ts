import 'server-only';

import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  _client = new OpenAI({ apiKey: key });
  return _client;
}

export interface ExtractedLoadFields {
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

const SYSTEM_PROMPT = `You extract structured load/dispatch information from a freight broker's rate confirmation document.
The document text was produced by OCR and may contain noise, line breaks in odd places, and inconsistent casing.

Rules:
- Dates must be in YYYY-MM-DD format. If you cannot parse a date, return an empty string.
- "loadPrice" is the dollar amount the broker is paying the carrier (look for labels like "Total", "Rate", "Carrier Pay", "Line Haul", "Agreed Rate"). Return a plain number, no $ or commas. If unsure, return 0.
- "reference" is the broker's load/PRO/order/confirmation number (e.g. "Load #", "Order #", "PRO", "Confirmation #"). One short string.
- Addresses should include street, city, state, zip when available. If the document shows only city/state, that's fine.
- "originCompany" / "destinationCompany" are the names of the shipper / receiver, NOT the broker.
- "notes" is a short summary of any special instructions, appointment requirements, commodity, weight, or temperature. Keep under 300 chars.
- If a field is genuinely missing from the document, return an empty string (or 0 for loadPrice). Do not invent.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'pickupDate',
    'deliveryDate',
    'originCompany',
    'originAddress',
    'destinationCompany',
    'destinationAddress',
    'loadPrice',
    'reference',
    'notes',
  ],
  properties: {
    pickupDate: { type: 'string' },
    deliveryDate: { type: 'string' },
    originCompany: { type: 'string' },
    originAddress: { type: 'string' },
    destinationCompany: { type: 'string' },
    destinationAddress: { type: 'string' },
    loadPrice: { type: 'number' },
    reference: { type: 'string' },
    notes: { type: 'string' },
  },
} as const;

export async function extractLoadFieldsFromText(text: string): Promise<ExtractedLoadFields> {
  const client = getClient();
  const trimmed = text.slice(0, 20000); // hard cap

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Extract load fields from this rate confirmation:\n\n${trimmed}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'load_fields',
        strict: true,
        schema: SCHEMA,
      },
    },
  });

  const raw = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Partial<ExtractedLoadFields>;
  return {
    pickupDate: String(parsed.pickupDate ?? ''),
    deliveryDate: String(parsed.deliveryDate ?? ''),
    originCompany: String(parsed.originCompany ?? ''),
    originAddress: String(parsed.originAddress ?? ''),
    destinationCompany: String(parsed.destinationCompany ?? ''),
    destinationAddress: String(parsed.destinationAddress ?? ''),
    loadPrice: Number.isFinite(parsed.loadPrice) ? Number(parsed.loadPrice) : 0,
    reference: String(parsed.reference ?? ''),
    notes: String(parsed.notes ?? ''),
  };
}
