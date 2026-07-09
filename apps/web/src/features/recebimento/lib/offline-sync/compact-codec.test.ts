import { describe, expect, it } from 'vitest';

import {
  COMPACT_QR_PREFIX,
  encodeCompactQrPayload,
  normalizeOfflineScanInput,
  tryDecodeCompactQrPayload,
} from './compact-codec';

describe('normalizeOfflineScanInput', () => {
  it('preserva payload já correto', () => {
    const raw = `${COMPACT_QR_PREFIX}abc123`;
    expect(normalizeOfflineScanInput(raw)).toBe(raw);
  });

  it('corrige Ç enviado pelo leitor ABNT no lugar de dois-pontos', () => {
    const encoded = encodeCompactQrPayload({
      v: 1,
      id: 'test-id',
      at: '2026-07-09T00:00:00.000Z',
      sc: 'errors',
      en: [],
    });

    const misread = encoded.replace('KLS2:', 'KLS2Ç');
    expect(normalizeOfflineScanInput(misread)).toBe(encoded);
  });

  it('normaliza prefixo em minúsculas', () => {
    const raw = 'kls2:payload';
    expect(normalizeOfflineScanInput(raw)).toBe('KLS2:payload');
  });
});

describe('tryDecodeCompactQrPayload', () => {
  it('decodifica payload com prefixo corrigido de leitor ABNT', () => {
    const encoded = encodeCompactQrPayload({
      v: 1,
      id: 'export-1',
      at: '2026-07-09T00:00:00.000Z',
      sc: 'errors',
      en: [],
    });

    const misread = encoded.replace('KLS2:', 'KLS2Ç');
    const decoded = tryDecodeCompactQrPayload(misread);

    expect(decoded).not.toBeNull();
    expect(decoded && 'exportId' in decoded && decoded.exportId).toBe('export-1');
  });
});
