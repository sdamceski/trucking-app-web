import 'server-only';

import { Storage, type Bucket } from '@google-cloud/storage';

let _bucket: Bucket | null = null;

function loadCredentials(): { projectId: string; credentials: Record<string, string> } {
  const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64;
  if (!b64) throw new Error('GCP_SERVICE_ACCOUNT_JSON_B64 is not set');
  const json = Buffer.from(b64, 'base64').toString('utf8');
  const parsed = JSON.parse(json) as Record<string, string>;
  const projectId = process.env.GCP_PROJECT_ID || parsed.project_id;
  if (!projectId) throw new Error('GCP_PROJECT_ID is not set');
  return { projectId, credentials: parsed };
}

export function getBucket(): Bucket {
  if (_bucket) return _bucket;
  const name = process.env.GCS_BUCKET;
  if (!name) throw new Error('GCS_BUCKET is not set');
  const { projectId, credentials } = loadCredentials();
  const storage = new Storage({ projectId, credentials });
  _bucket = storage.bucket(name);
  return _bucket;
}

export function objectKey(loadId: string, docId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]+/g, '_').slice(-120);
  return `loads/${loadId}/${docId}-${safe}`;
}

export async function uploadObject(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  await getBucket().file(key).save(bytes, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'private, max-age=0' },
  });
}

export async function deleteObject(key: string): Promise<void> {
  await getBucket().file(key).delete({ ignoreNotFound: true });
}

export async function deletePrefix(prefix: string): Promise<void> {
  await getBucket().deleteFiles({ prefix, force: true });
}

export async function moveObject(srcKey: string, dstKey: string): Promise<void> {
  await getBucket().file(srcKey).move(getBucket().file(dstKey));
}

export async function downloadObject(key: string): Promise<Buffer> {
  const [buf] = await getBucket().file(key).download();
  return buf;
}

export async function signDownloadUrl(
  key: string,
  filename: string,
  opts: { inline?: boolean; ttlMs?: number } = {},
): Promise<string> {
  const { inline = false, ttlMs = 60 * 60 * 1000 } = opts;
  const disposition = inline ? 'inline' : 'attachment';
  const safeName = filename.replace(/"/g, '');
  const [url] = await getBucket().file(key).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + ttlMs,
    responseDisposition: `${disposition}; filename="${safeName}"`,
  });
  return url;
}
