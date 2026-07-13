import { describe, expect, it } from 'vitest';

import {
  buildChecklistSyncPayload,
  countChecklistPhotoMediaIds,
  normalizeTempBau,
} from './checklist-sync-payload';

describe('checklist-sync-payload', () => {
  it('normalizes string temperature values', () => {
    expect(normalizeTempBau('-18.5')).toBe(-18.5);
    expect(normalizeTempBau('')).toBeUndefined();
    expect(normalizeTempBau(undefined)).toBeUndefined();
  });

  it('counts checklist photos from media ids', () => {
    expect(
      countChecklistPhotoMediaIds({
        lacre: ['a'],
        bauFechado: ['b'],
        bauAberto: ['c'],
        extras: ['d', 'e'],
      }),
    ).toBe(5);
  });

  it('builds sync payload with numeric tempBau and photoCount', () => {
    const payload = buildChecklistSyncPayload({
      demandId: 'demand-1',
      dockId: 'dock-1',
      form: {
        dock: 'dock-1',
        lacre: '123',
        tempBau: '-18.5' as unknown as number,
        conditions: { limpeza: true },
        observacoes: 'ok',
      },
      photoMediaIds: {
        lacre: ['p1'],
        bauFechado: ['p2'],
        bauAberto: ['p3'],
        extras: [],
      },
    });

    expect(payload.tempBau).toBe(-18.5);
    expect(payload.photoCount).toBe(3);
    expect(payload.lacre).toBe('123');
  });
});
