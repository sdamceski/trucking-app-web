import { randomBytes } from 'node:crypto';

export function newId(prefix: string): string {
  return `${prefix}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
