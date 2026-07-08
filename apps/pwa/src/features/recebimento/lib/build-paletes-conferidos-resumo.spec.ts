import { describe, expect, it } from 'vitest';

import {
  buildLotesDisponiveisPorProduto,
  buildPaletesConferidosResumo,
} from './build-paletes-conferidos-resumo';
import type { ConferenciaConferidoDetalheApi } from '../types/recebimento.api';

const defaultConfig = {
  controlaLote: true,
  controlaValidade: false,
  controlaPeso: false,
  pesoVariavel: false,
  controlaNumeroSerie: false,
};

function makeConferido(
  overrides: Partial<ConferenciaConferidoDetalheApi> = {},
): ConferenciaConferidoDetalheApi {
  return {
    id: 'item-1',
    produtoId: 'prod-1',
    quantidadeRecebida: 12,
    unidadeMedida: 'UN',
    sku: 'SKU-1',
    descricao: 'Produto 1',
    unidadesPorCaixa: 12,
    config: defaultConfig,
    loteRecebido: 'L1',
    validade: null,
    pesoRecebido: null,
    etiquetaCodigo: null,
    pesagemId: null,
    recebimentoItemId: 'item-1',
    unitizadorCodigo: 'P-A',
    unitizadorId: null,
    ...overrides,
  };
}

describe('buildPaletesConferidosResumo', () => {
  it('agrupa conferidos por unitizadorCodigo', () => {
    const resumo = buildPaletesConferidosResumo([
      makeConferido({ unitizadorCodigo: 'P-A' }),
      makeConferido({
        id: 'item-2',
        quantidadeRecebida: 6,
        unitizadorCodigo: 'P-B',
      }),
    ]);

    expect(resumo).toHaveLength(2);
    expect(resumo.map((palete) => palete.unitizadorCodigo)).toEqual(['P-A', 'P-B']);
    expect(resumo[0]?.itens[0]?.lote).toBe('L1');
  });
});

describe('buildLotesDisponiveisPorProduto', () => {
  it('retorna lotes únicos conferidos para o produto', () => {
    const lotes = buildLotesDisponiveisPorProduto(
      [
        makeConferido({ loteRecebido: 'L2', unitizadorCodigo: 'P-A' }),
        makeConferido({
          id: 'item-2',
          loteRecebido: 'L1',
          unitizadorCodigo: 'P-B',
        }),
        makeConferido({
          id: 'item-3',
          produtoId: 'prod-2',
          sku: 'SKU-2',
          descricao: 'Produto 2',
          loteRecebido: 'LX',
          unitizadorCodigo: 'P-C',
        }),
      ],
      'prod-1',
    );

    expect(lotes).toEqual(['L1', 'L2']);
  });
});
