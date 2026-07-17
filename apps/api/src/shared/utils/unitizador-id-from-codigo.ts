import { createHash } from 'node:crypto';

/** Deterministic UUID derived from recebimento + scanned palete code (no FK table). */
export function unitizadorIdFromCodigo(
  recebimentoId: string,
  codigo: string,
): string {
  const bytes = createHash('sha256')
    .update(`${recebimentoId}\0${codigo.trim()}`)
    .digest();

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.subarray(0, 16).toString('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
