'use server';

import { revalidatePath } from 'next/cache';
import {
  addLoadDocument,
  getLoad,
  getLoadDocument,
  removeLoadDocument,
} from '@/lib/store';
import { DOC_CATEGORIES, type DocCategory, type LoadDocument } from '@/lib/types';
import { newId } from '@/lib/ids';
import { deleteObject, objectKey, signDownloadUrl, uploadObject } from '@/lib/gcs';
import { requireAdmin } from '@/lib/auth/dal';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const VALID_CATEGORY = new Set<DocCategory>(DOC_CATEGORIES);

export async function uploadLoadDocument(loadId: string, fd: FormData): Promise<void> {
  await requireAdmin();

  const load = await getLoad(loadId);
  if (!load) throw new Error('Load not found');

  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No file provided');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File exceeds 25 MB limit');
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED.has(mime)) {
    throw new Error('Unsupported file type');
  }
  const rawCategory = String(fd.get('category') ?? '');
  const category: DocCategory = VALID_CATEGORY.has(rawCategory as DocCategory)
    ? (rawCategory as DocCategory)
    : 'other';

  const id = newId('DOC');
  const filename = file.name || `${id}.bin`;
  const key = objectKey(loadId, id, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await uploadObject(key, bytes, mime);

  const doc: LoadDocument = {
    id,
    category,
    name: filename,
    size: file.size,
    mimeType: mime,
    uploadedAt: new Date().toISOString(),
    url: key,
  };
  await addLoadDocument(loadId, doc);

  revalidatePath('/loads');
  revalidatePath(`/loads/${loadId}`);
}

export async function deleteLoadDocument(loadId: string, docId: string): Promise<void> {
  await requireAdmin();
  const removed = await removeLoadDocument(loadId, docId);
  if (!removed) return;
  try {
    await deleteObject(removed.url);
  } catch {
    // best-effort
  }
  revalidatePath('/loads');
  revalidatePath(`/loads/${loadId}`);
}

export async function getLoadDocumentDownloadUrl(
  loadId: string,
  docId: string,
): Promise<string> {
  await requireAdmin();
  const doc = await getLoadDocument(loadId, docId);
  if (!doc) throw new Error('Document not found');
  return signDownloadUrl(doc.url, doc.name);
}

export async function getLoadDocumentViewUrl(
  loadId: string,
  docId: string,
): Promise<{ url: string; mimeType: string; name: string }> {
  await requireAdmin();
  const doc = await getLoadDocument(loadId, docId);
  if (!doc) throw new Error('Document not found');
  const url = await signDownloadUrl(doc.url, doc.name, { inline: true });
  return { url, mimeType: doc.mimeType, name: doc.name };
}
