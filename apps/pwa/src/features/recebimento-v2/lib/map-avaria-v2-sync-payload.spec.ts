import { describe, expect, it } from 'vitest';

import type { DamageRecord } from '../local-db/schema';
import {
  isValidAvariaV2SyncPayload,
  mapAvariaV2SyncPayload,
} from './map-avaria-v2-sync-payload';

function makeDamage(overrides: Partial<DamageRecord> = {}): DamageRecord {
  return {
    id: 'damage-1',
    demandId: 'demand-1',
    description: 'Avaria',
    quantity: 3,
    motivo: 'tipo-x',
    tipo: 'tipo-x',
    natureza: 'nat-1',
    causa: 'causa-1',
    sku: '12345',
    lote: 'L001',
    quantidadeCaixa: 1,
    quantidadeUnidade: 2,
    mediaIds: ['media-1', 'media-2'],
    registradoAt: new Date().toISOString(),
    syncStatus: 'pending',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('mapAvariaV2SyncPayload', () => {
  it('maps local damage fields to API payload', () => {
    const payload = mapAvariaV2SyncPayload(makeDamage(), 'prod-99');

    expect(payload).toEqual({
      damageId: 'damage-1',
      produtoId: 'prod-99',
      lote: 'L001',
      tipo: 'tipo-x',
      natureza: 'nat-1',
      causa: 'causa-1',
      quantidadeCaixas: 1,
      quantidadeUnidades: 2,
      photoCount: 2,
      skusAlvo: ['12345'],
      sku: '12345',
      mediaIds: ['media-1', 'media-2'],
    });
  });

  it('validates mapped payload', () => {
    const payload = mapAvariaV2SyncPayload(makeDamage(), 'prod-99');
    expect(isValidAvariaV2SyncPayload(payload)).toBe(true);
  });

  it('registers replicated damage as a single SKU target without backend replication flag', () => {
    const payload = mapAvariaV2SyncPayload(
      makeDamage({
        replicarParaTodos: true,
        skusAlvo: ['12345', '67890'],
      }),
      'prod-99',
    );

    expect(payload.skusAlvo).toEqual(['12345']);
    expect(payload).not.toHaveProperty('replicarParaTodos');
  });
});
