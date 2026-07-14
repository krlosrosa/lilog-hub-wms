import { describe, expect, it } from 'vitest';

import {
  buildSkuByProdutoIdMap,
  mapServerAvariaToRecord,
  mapServerConferenciaToRecord,
  mapServerTemperaturaToRecord,
  resolveSnapshotAvarias,
  resolveSnapshotConferences,
  resolveSnapshotTemperaturas,
} from './map-snapshot-v2';

describe('map-snapshot-v2', () => {
  it('resolveSnapshotConferences prefers conferences and falls back to conferencias', () => {
    expect(
      resolveSnapshotConferences({
        demandId: 'd1',
        revision: 1,
        conferences: [{ id: 'local-shape' }],
      }),
    ).toEqual([{ id: 'local-shape' }]);

    expect(
      resolveSnapshotConferences({
        demandId: 'd1',
        revision: 1,
        conferencias: [{ id: 'server-shape' }],
      }),
    ).toEqual([{ id: 'server-shape' }]);
  });

  it('resolveSnapshotAvarias prefers damages and falls back to avarias', () => {
    expect(
      resolveSnapshotAvarias({
        demandId: 'd1',
        revision: 1,
        damages: [{ id: 'damage-1' }],
      }),
    ).toEqual([{ id: 'damage-1' }]);

    expect(
      resolveSnapshotAvarias({
        demandId: 'd1',
        revision: 1,
        avarias: [{ id: 'avaria-1' }],
      }),
    ).toEqual([{ id: 'avaria-1' }]);
  });

  it('resolveSnapshotTemperaturas prefers temperatures and falls back to temperaturas', () => {
    expect(
      resolveSnapshotTemperaturas({
        demandId: 'd1',
        revision: 1,
        temperatures: [{ etapa: 'inicio', temperatura: -18 }],
      }),
    ).toEqual([{ etapa: 'inicio', temperatura: -18 }]);

    expect(
      resolveSnapshotTemperaturas({
        demandId: 'd1',
        revision: 1,
        temperaturas: [{ etapa: 'fim', temperatura: -17.5 }],
      }),
    ).toEqual([{ etapa: 'fim', temperatura: -17.5 }]);
  });

  it('mapServerTemperaturaToRecord maps etapas to local temperature records', () => {
    const record = mapServerTemperaturaToRecord(
      { etapa: 'meio', temperatura: -18.4 },
      'demand-1',
      123,
    );

    expect(record).toEqual({
      id: 'demand-1::meio',
      demandId: 'demand-1',
      etapa: 'meio',
      temperatura: -18.4,
      syncStatus: 'synced',
      updatedAt: 123,
    });
  });

  it('mapServerConferenciaToRecord maps server item id to serverItemId', () => {
    const record = mapServerConferenciaToRecord(
      {
        id: 'item-123',
        produtoId: 'PROD-1',
        quantidadeRecebida: 12,
        loteRecebido: '1234567890',
        validade: '2026-01-15T00:00:00.000Z',
        createdAt: '2026-07-10T12:00:00.000Z',
      },
      'demand-1',
      1_700_000_000_000,
    );

    expect(record.id).toBe('item-123');
    expect(record.serverItemId).toBe('item-123');
    expect(record.demandId).toBe('demand-1');
    expect(record.sku).toBe('PROD-1');
    expect(record.lote).toBe('1234567890');
    expect(record.quantity).toBe(12);
    expect(record.syncStatus).toBe('synced');
  });

  it('mapServerConferenciaToRecord maps PVAR pesagem to one box per record', () => {
    const record = mapServerConferenciaToRecord(
      {
        id: 'pesagem-2',
        produtoId: 'PVAR-1',
        sku: 'SKU-PVAR',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 25,
        etiquetaCodigo: 'ETQ-2',
        pesagemId: 'pesagem-2',
        recebimentoItemId: 'item-aggregated',
      },
      'demand-1',
      1_700_000_000_000,
    );

    expect(record).toMatchObject({
      id: 'pesagem-2',
      sku: 'SKU-PVAR',
      quantity: 1,
      recebidaCaixa: 1,
      peso: 25,
      etiquetaCodigo: 'ETQ-2',
      isPvarBox: true,
      serverItemId: 'item-aggregated',
      serverPesagemId: 'pesagem-2',
      syncStatus: 'synced',
    });
  });

  it('mapServerConferenciaToRecord resolves sku from produtoId lookup', () => {
    const skuByProdutoId = new Map([['uuid-prod-1', 'SKU-999']]);

    const record = mapServerConferenciaToRecord(
      {
        id: 'item-456',
        produtoId: 'uuid-prod-1',
        quantidadeRecebida: 5,
        createdAt: '2026-07-10T12:00:00.000Z',
      },
      'demand-1',
      1_700_000_000_000,
      'ambos',
      skuByProdutoId,
    );

    expect(record.sku).toBe('SKU-999');
  });

  it('buildSkuByProdutoIdMap prefers expected items over catalog', () => {
    const map = buildSkuByProdutoIdMap(
      [{ produtoId: 'p1', sku: 'SKU-A' }],
      [{ produtoId: 'p1', sku: 'SKU-B' }, { produtoId: 'p2', sku: 'SKU-C' }],
    );

    expect(map.get('p1')).toBe('SKU-A');
    expect(map.get('p2')).toBe('SKU-C');
  });

  it('mapServerAvariaToRecord maps server avaria with sku lookup', () => {
    const skuByProdutoId = new Map([['uuid-prod-2', 'SKU-200']]);

    const record = mapServerAvariaToRecord(
      {
        id: 'avaria-99',
        produtoId: 'uuid-prod-2',
        tipo: 'embalagem',
        natureza: 'avaria',
        causa: 'transporte',
        quantidadeCaixas: 2,
        quantidadeUnidades: 3,
        createdAt: '2026-07-10T12:00:00.000Z',
      },
      'demand-1',
      1_700_000_000_000,
      skuByProdutoId,
    );

    expect(record.id).toBe('avaria-99');
    expect(record.serverAvariaId).toBe('avaria-99');
    expect(record.sku).toBe('SKU-200');
    expect(record.quantity).toBe(5);
    expect(record.quantidadeCaixa).toBe(2);
    expect(record.quantidadeUnidade).toBe(3);
    expect(record.syncStatus).toBe('synced');
  });
});
