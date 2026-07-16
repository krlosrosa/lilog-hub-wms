import { describe, expect, it } from 'vitest';

import { mapConferenciaV2SyncPayload } from './map-conferencia-v2-sync-payload';

const baseRecord = {
  id: 'c1',
  demandId: 'd1',
  sku: '123',
  quantity: 10,
  recebidaCaixa: 1,
  recebidaUnidade: 0,
  conferidoAt: new Date().toISOString(),
  syncStatus: 'pending' as const,
  updatedAt: Date.now(),
};

const baseMeta = {
  produtoId: 'p1',
  unidadesPorCaixa: 10,
  pesoVariavel: false,
  controlaLote: true,
  controlaValidade: true,
  controlaPalete: true,
};

describe('mapConferenciaV2SyncPayload', () => {
  it('includes unitizadorCodigo when present on conference record', () => {
    const payload = mapConferenciaV2SyncPayload(
      {
        ...baseRecord,
        unitizadorCodigo: 'PAL-001',
      },
      baseMeta,
      'lote',
    );

    expect(payload.unitizadorCodigo).toBe('PAL-001');
  });

  it('sends loteRecebido when loteModo is ambos and controlaLote is false', () => {
    const payload = mapConferenciaV2SyncPayload(
      {
        ...baseRecord,
        lote: '5001251010',
      },
      { ...baseMeta, controlaLote: false },
      'ambos',
    );

    expect(payload.loteRecebido).toBe('5001251010');
  });

  it('sends loteRecebido when loteModo is lote and controlaLote is false', () => {
    const payload = mapConferenciaV2SyncPayload(
      {
        ...baseRecord,
        lote: '5001251010',
      },
      { ...baseMeta, controlaLote: false },
      'lote',
    );

    expect(payload.loteRecebido).toBe('5001251010');
  });

  it('does not send loteRecebido when loteModo is fabricacao', () => {
    const payload = mapConferenciaV2SyncPayload(
      {
        ...baseRecord,
        lote: '5001251010',
      },
      baseMeta,
      'fabricacao',
    );

    expect(payload.loteRecebido).toBeUndefined();
  });

  it('does not send loteRecebido when lote is empty or blank', () => {
    const empty = mapConferenciaV2SyncPayload(
      { ...baseRecord, lote: '' },
      baseMeta,
      'ambos',
    );
    const blank = mapConferenciaV2SyncPayload(
      { ...baseRecord, lote: '   ' },
      baseMeta,
      'ambos',
    );

    expect(empty.loteRecebido).toBeUndefined();
    expect(blank.loteRecebido).toBeUndefined();
  });

  it('includes clientConferenceId when pesoVariavel is true', () => {
    const payload = mapConferenciaV2SyncPayload(
      { ...baseRecord, id: 'conf-uuid-001', peso: 12.5 },
      { ...baseMeta, pesoVariavel: true },
      'lote',
    );

    expect(payload.clientConferenceId).toBe('conf-uuid-001');
    expect(payload.quantidadeRecebida).toBe(1);
    expect(payload.unidadeMedida).toBe('CX');
  });

  it('does not include clientConferenceId for non-PVAR items', () => {
    const payload = mapConferenciaV2SyncPayload(baseRecord, baseMeta, 'lote');

    expect(payload.clientConferenceId).toBeUndefined();
  });
});
