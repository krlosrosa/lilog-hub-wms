import { describe, expect, it } from 'vitest';

import {
  buildItensAguardandoArmazenagem,
  buildItensAguardandoArmazenagemDePaletesBipados,
} from '../../../src/domain/services/build-itens-aguardando-armazenagem.js';
import type { RecebimentoAvariaRecord } from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import type { ItemRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';

describe('buildItensAguardandoArmazenagemDePaletesBipados', () => {
  const unitizadorId = '00000000-0000-4000-8000-000000000010';

  const baseAvaria = (
    overrides: Partial<RecebimentoAvariaRecord>,
  ): RecebimentoAvariaRecord => ({
    id: 'avaria-1',
    recebimentoId: 'rec-1',
    produtoId: 'PROD-1',
    tipo: 'embalagem',
    natureza: 'transporte',
    causa: 'impacto',
    quantidadeCaixas: 0,
    quantidadeUnidades: 2,
    lote: 'L1',
    validade: null,
    numeroSerie: null,
    photoCount: 0,
    replicado: false,
    operatorId: 1,
    createdAt: new Date(),
    ...overrides,
  });

  const baseItem = (
    overrides: Partial<ItemRecebimentoRecord>,
  ): ItemRecebimentoRecord => ({
    id: 'item-1',
    recebimentoId: 'rec-1',
    produtoId: 'PROD-1',
    quantidadeRecebida: 2,
    unidadeMedida: 'CX',
    loteRecebido: null,
    validade: null,
    pesoRecebido: null,
    numeroSerie: null,
    unitizadorId: unitizadorId,
    createdAt: new Date(),
    ...overrides,
  });

  it('includes bipados items even when deposit routing would exclude them', () => {
    const itensConferidos = [
      baseItem({ id: 'item-1', quantidadeRecebida: 2 }),
    ];

    const filtered = buildItensAguardandoArmazenagem({
      itensConferidos,
      divergenciasPorProduto: new Map(),
      unidadesPorCaixaMap: new Map([['PROD-1', 4]]),
      depositoDestinoOverridesPorItemId: new Map([['item-1', 'DEB_TRANSP']]),
      destinosElegiveis: ['AGUARD_ARM', 'QUARENTENA'],
    });

    const bipados = buildItensAguardandoArmazenagemDePaletesBipados({
      itensConferidos,
      unidadesPorCaixaMap: new Map([['PROD-1', 4]]),
    });

    expect(filtered).toEqual([]);
    expect(bipados).toEqual([
      expect.objectContaining({
        unitizadorId,
        produtoId: 'PROD-1',
        quantidade: 8,
        unidadeMedida: 'UN',
      }),
    ]);
  });

  it('ignores conferidos without unitizadorId', () => {
    const result = buildItensAguardandoArmazenagemDePaletesBipados({
      itensConferidos: [baseItem({ unitizadorId: null })],
      unidadesPorCaixaMap: new Map([['PROD-1', 1]]),
    });

    expect(result).toEqual([]);
  });

  it('subtracts avaria quantity from storage demand for matching lot', () => {
    const itensConferidos = [
      baseItem({
        id: 'item-1',
        quantidadeRecebida: 10,
        unidadeMedida: 'UN',
        loteRecebido: 'L1',
      }),
    ];

    const result = buildItensAguardandoArmazenagem({
      itensConferidos,
      divergenciasPorProduto: new Map(),
      unidadesPorCaixaMap: new Map([['PROD-1', 1]]),
      avarias: [baseAvaria({ quantidadeUnidades: 2, lote: 'L1' })],
    });

    expect(result).toEqual([
      expect.objectContaining({
        produtoId: 'PROD-1',
        lote: 'L1',
        quantidade: 8,
        unidadeMedida: 'UN',
      }),
    ]);
  });

  it('excludes lot from storage demand when fully damaged', () => {
    const itensConferidos = [
      baseItem({
        id: 'item-1',
        quantidadeRecebida: 5,
        unidadeMedida: 'UN',
        loteRecebido: 'L1',
      }),
    ];

    const result = buildItensAguardandoArmazenagem({
      itensConferidos,
      divergenciasPorProduto: new Map(),
      unidadesPorCaixaMap: new Map([['PROD-1', 1]]),
      avarias: [baseAvaria({ quantidadeUnidades: 5, lote: 'L1' })],
    });

    expect(result).toEqual([]);
  });

  it('subtracts avaria quantity from bipados items for matching lot', () => {
    const itensConferidos = [
      baseItem({
        id: 'item-1',
        quantidadeRecebida: 2,
        loteRecebido: 'L1',
      }),
    ];

    const result = buildItensAguardandoArmazenagemDePaletesBipados({
      itensConferidos,
      unidadesPorCaixaMap: new Map([['PROD-1', 4]]),
      avarias: [baseAvaria({ quantidadeUnidades: 3, lote: 'L1' })],
    });

    expect(result).toEqual([
      expect.objectContaining({
        unitizadorId,
        produtoId: 'PROD-1',
        lote: 'L1',
        quantidade: 5,
        unidadeMedida: 'UN',
      }),
    ]);
  });
});
