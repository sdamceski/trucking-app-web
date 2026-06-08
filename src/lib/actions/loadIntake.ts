'use server';

import { requireAdmin } from '@/lib/auth/dal';
import { newId } from '@/lib/ids';
import { extractTextFromDocument } from '@/lib/ocr';
import { extractLoadFieldsFromText, type ExtractedLoadFields } from '@/lib/ai';
import { objectKey, uploadObject } from '@/lib/gcs';

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface StagedDocument {
  stagingKey: string;
  docId: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ExtractResult {
  staged: StagedDocument;
  fields: ExtractedLoadFields;
  ocrCharCount: number;
}

/**
 * Upload a file to staging/<uuid>/..., run OCR + AI extraction, return staged
 * ref + extracted fields. The bucket lifecycle rule reaps staging/ after 1d.
 */
export async function extractLoadFromDocument(fd: FormData): Promise<ExtractResult> {
  await requireAdmin();

  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No file provided');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File exceeds 15 MB limit');
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED.has(mime)) {
    throw new Error('Unsupported file type');
  }

  const docId = newId('DOC');
  const filename = file.name || `${docId}.bin`;
  const stagingKey = `staging/${docId}/${objectKey('_', docId, filename).split('/').pop()}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await uploadObject(stagingKey, bytes, mime);

  let ocrText = '';
  try {
    ocrText = await extractTextFromDocument(bytes, mime);
  } catch (err) {
    throw new Error(
      `OCR failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }
  if (!ocrText.trim()) {
    throw new Error('No text detected in the document');
  }

  let fields: ExtractedLoadFields;
  try {
    fields = await extractLoadFieldsFromText(ocrText);
  } catch (err) {
    throw new Error(
      `AI extraction failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }

  return {
    staged: {
      stagingKey,
      docId,
      name: filename,
      size: file.size,
      mimeType: mime,
    },
    fields,
    ocrCharCount: ocrText.length,
  };
}
