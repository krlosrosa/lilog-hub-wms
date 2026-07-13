import { describe, expect, it } from 'vitest';

import {
  hasServerChecklistPhotos,
  mapServerChecklistToRecord,
  resolveSnapshotChecklist,
} from './map-server-checklist-v2';
import { isChecklistComplete } from './is-checklist-complete';
import type { ChecklistRecord } from '../local-db/schema';

describe('map-server-checklist-v2', () => {
  it('resolveSnapshotChecklist prefers singular checklist', () => {
    expect(
      resolveSnapshotChecklist({
        demandId: 'd1',
        revision: 1,
        checklist: { id: 'chk-1' },
      }),
    ).toEqual({ id: 'chk-1' });

    expect(
      resolveSnapshotChecklist({
        demandId: 'd1',
        revision: 1,
        checklists: [{ id: 'chk-2' }],
      }),
    ).toEqual({ id: 'chk-2' });
  });

  it('mapServerChecklistToRecord maps server checklist fields', () => {
    const record = mapServerChecklistToRecord(
      {
        id: 'chk-99',
        lacre: 'ABC123',
        tempBau: 4,
        conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        observacoes: 'ok',
        photoCount: 4,
        createdAt: '2026-07-10T12:00:00.000Z',
      },
      'demand-1',
      'Doca 3',
      1_700_000_000_000,
    );

    expect(record.demandId).toBe('demand-1');
    expect(record.serverChecklistId).toBe('chk-99');
    expect(record.dock).toBe('Doca 3');
    expect(record.lacre).toBe('ABC123');
    expect(record.serverPhotoCount).toBe(4);
    expect(record.syncStatus).toBe('synced');
  });

  it('hasServerChecklistPhotos requires minimum photo count', () => {
    expect(hasServerChecklistPhotos({ serverPhotoCount: 2 })).toBe(false);
    expect(hasServerChecklistPhotos({ serverPhotoCount: 3 })).toBe(true);
  });
});

describe('is-checklist-complete', () => {
  const base: ChecklistRecord = {
    demandId: 'd1',
    id: 'c1',
    dock: 'Doca 1',
    lacre: '123',
    conditions: {},
    savedAt: '2026-01-01',
    syncStatus: 'synced',
    updatedAt: 1,
  };

  it('accepts local checklist photos', () => {
    expect(
      isChecklistComplete({
        ...base,
        photoMediaIds: {
          lacre: ['m1'],
          bauFechado: ['m2'],
          bauAberto: ['m3'],
        },
      }),
    ).toBe(true);
  });

  it('accepts server checklist photos when local photos are absent', () => {
    expect(
      isChecklistComplete({
        ...base,
        serverPhotoCount: 3,
      }),
    ).toBe(true);
  });

  it('rejects checklist without dock/lacre', () => {
    expect(
      isChecklistComplete({
        ...base,
        dock: '',
        serverPhotoCount: 5,
      }),
    ).toBe(false);
  });
});
