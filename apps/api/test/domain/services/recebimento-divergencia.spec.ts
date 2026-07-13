import { describe, expect, it } from 'vitest';

import { calcularDivergencias } from '../../../src/domain/services/recebimento-divergencia.js';
import type { ItemPreRecebimentoRecord } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const baseEsperado: ItemPreRecebimentoRecord = {
  id: 'pre-item-1',
  preRecebimentoId: 'pre-1',
  produtoId: 'prod-pvar',
  quantidadeEsperada: 10,
  unidadeMedida: 'UN',
  unidadesPorCaixa: 1,
  loteEsperado: null,
  pesoEsperado: null,
  validadeEsperada: null,
  createdAt: new Date(),
};

const baseRecebido: ItemRecebimentoRecord = {
  id: 'item-1',
  recebimentoId: 'rec-1',
  unidadeId: 'ITB',
  produtoId: 'prod-pvar',
  quantidadeRecebida: 10,
  unidadeMedida: 'UN',
  loteRecebido: null,
  pesoRecebido: 10,
  validade: null,
  numeroSerie: null,
  unitizadorId: null,
  createdAt: new Date(),
};

const pvarProduto: ProdutoRecord = {
  produtoId: 'prod-pvar',
  sku: 'SKU-PVAR',
  descricao: 'Produto PVAR',
  empresa: 'lilog',
  categoria: 'seco',
  grupo: null,
  tipo: 'PVAR',
  ean: null,
  dum: null,
  shelfLife: null,
  pesoBrutoUnidade: '1',
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 1,
  caixasPorPalete: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ppadProduto: ProdutoRecord = {
  ...pvarProduto,
  produtoId: 'prod-ppad',
  sku: 'SKU-PPAD',
  tipo: 'PPAD',
};

describe('calcularDivergencias peso', () => {
  it('gera divergencia_peso para PVAR quando peso recebido difere do esperado informado', () => {
    const divergencias = calcularDivergencias(
      [{ ...baseEsperado, pesoEsperado: 10 }],
      [{ ...baseRecebido, pesoRecebido: 8 }],
      new Map([['prod-pvar', pvarProduto]]),
    );

    expect(divergencias).toContainEqual(
      expect.objectContaining({
        produtoId: 'prod-pvar',
        tipoDivergencia: 'divergencia_peso',
      }),
    );
  });

  it('gera divergencia_peso para PVAR quando peso recebido excede o esperado', () => {
    const divergencias = calcularDivergencias(
      [{ ...baseEsperado, pesoEsperado: 10 }],
      [{ ...baseRecebido, pesoRecebido: 12 }],
      new Map([['prod-pvar', pvarProduto]]),
    );

    expect(divergencias).toContainEqual(
      expect.objectContaining({
        produtoId: 'prod-pvar',
        tipoDivergencia: 'divergencia_peso',
      }),
    );
  });

  it('calcula peso esperado via cadastro quando PVAR nao tem pesoEsperado no pre-recebimento', () => {
    const divergencias = calcularDivergencias(
      [baseEsperado],
      [{ ...baseRecebido, pesoRecebido: 9 }],
      new Map([['prod-pvar', pvarProduto]]),
    );

    expect(divergencias).toContainEqual(
      expect.objectContaining({
        produtoId: 'prod-pvar',
        tipoDivergencia: 'divergencia_peso',
        descricao: 'Peso esperado 10, recebido 9',
      }),
    );
  });

  it('nao gera divergencia_peso para produto nao-PVAR mesmo com peso preenchido', () => {
    const divergencias = calcularDivergencias(
      [
        {
          ...baseEsperado,
          produtoId: 'prod-ppad',
          pesoEsperado: 10,
        },
      ],
      [
        {
          ...baseRecebido,
          produtoId: 'prod-ppad',
          pesoRecebido: 8,
        },
      ],
      new Map([['prod-ppad', ppadProduto]]),
    );

    expect(
      divergencias.some((item) => item.tipoDivergencia === 'divergencia_peso'),
    ).toBe(false);
  });
});
