import 'server-only';

import { ImageAnnotatorClient } from '@google-cloud/vision';

let _client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (_client) return _client;
  const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64;
  if (!b64) throw new Error('GCP_SERVICE_ACCOUNT_JSON_B64 is not set');
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const projectId = process.env.GCP_PROJECT_ID || credentials.project_id;
  _client = new ImageAnnotatorClient({ projectId, credentials });
  return _client;
}

/**
 * Extract text from a PDF (≤5 pages) or image using Vision's document text
 * detection. Returns the concatenated full text across pages.
 */
export async function extractTextFromDocument(
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const client = getClient();

  if (mimeType === 'application/pdf') {
    const [result] = await client.batchAnnotateFiles({
      requests: [
        {
          inputConfig: {
            content: bytes.toString('base64'),
            mimeType: 'application/pdf',
          },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    });
    const pages = result.responses?.[0]?.responses ?? [];
    return pages
      .map((p) => p.fullTextAnnotation?.text ?? '')
      .filter(Boolean)
      .join('\n\n--- page break ---\n\n')
      .trim();
  }

  if (mimeType.startsWith('image/')) {
    const [result] = await client.documentTextDetection({
      image: { content: bytes.toString('base64') },
    });
    return (result.fullTextAnnotation?.text ?? '').trim();
  }

  throw new Error(`Unsupported mime type for OCR: ${mimeType}`);
}
