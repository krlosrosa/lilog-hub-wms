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

const prodMultiLote: ProdutoRecord = {
  produtoId: 'prod-multi',
  sku: '6128200462',
  descricao: 'BEB LAC POLPA MORANGO',
  empresa: 'lilog',
  categoria: 'alimentos',
  grupo: null,
  tipo: 'PPAD',
  ean: null,
  dum: null,
  shelfLife: 90,
  pesoBrutoUnidade: null,
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 12,
  caixasPorPalete: 40,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeEsperadoMultiLote(
  overrides: Partial<ItemPreRecebimentoRecord> = {},
): ItemPreRecebimentoRecord {
  return {
    id: 'pre-item-multi',
    preRecebimentoId: 'pre-1',
    produtoId: 'prod-multi',
    quantidadeEsperada: 540,
    unidadeMedida: 'CX',
    unidadesPorCaixa: 12,
    loteEsperado: '4002260704',
    pesoEsperado: null,
    validadeEsperada: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeRecebidoMultiLote(
  overrides: Partial<ItemRecebimentoRecord> = {},
): ItemRecebimentoRecord {
  return {
    id: 'item-multi',
    recebimentoId: 'rec-1',
    unidadeId: 'ITB',
    produtoId: 'prod-multi',
    quantidadeRecebida: 810,
    unidadeMedida: 'CX',
    loteRecebido: '4002260704',
    pesoRecebido: null,
    validade: null,
    numeroSerie: null,
    unitizadorId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('calcularDivergencias multiplos lotes por SKU', () => {
  const produtos = new Map([['prod-multi', prodMultiLote]]);

  it('nao gera divergencia de quantidade quando total esperado iguala total recebido', () => {
    const divergencias = calcularDivergencias(
      [
        makeEsperadoMultiLote({
          id: 'pre-1',
          quantidadeEsperada: 540,
          loteEsperado: '4002260704',
        }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 90,
          loteEsperado: '4002260706',
        }),
        makeEsperadoMultiLote({
          id: 'pre-3',
          quantidadeEsperada: 180,
          loteEsperado: '4002260702',
        }),
      ],
      [makeRecebidoMultiLote({ quantidadeRecebida: 810 })],
      produtos,
    );

    expect(
      divergencias.filter((item) =>
        ['quantidade_maior', 'quantidade_menor', 'produto_ausente'].includes(
          item.tipoDivergencia,
        ),
      ),
    ).toHaveLength(0);
  });

  it('gera uma unica divergencia quantidade_maior quando total recebido excede total esperado', () => {
    const divergencias = calcularDivergencias(
      [
        makeEsperadoMultiLote({
          id: 'pre-1',
          quantidadeEsperada: 540,
          loteEsperado: '4002260704',
        }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 90,
          loteEsperado: '4002260706',
        }),
      ],
      [makeRecebidoMultiLote({ quantidadeRecebida: 700 })],
      produtos,
    );

    const sobras = divergencias.filter(
      (item) => item.tipoDivergencia === 'quantidade_maior',
    );

    expect(sobras).toHaveLength(1);
    expect(sobras[0]).toMatchObject({
      produtoId: 'prod-multi',
      quantidadeEsperada: 630 * 12,
      quantidadeRecebida: 700 * 12,
    });
  });

  it('gera uma unica divergencia quantidade_menor quando total recebido fica abaixo do total esperado', () => {
    const divergencias = calcularDivergencias(
      [
        makeEsperadoMultiLote({
          id: 'pre-1',
          quantidadeEsperada: 540,
          loteEsperado: '4002260704',
        }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 270,
          loteEsperado: '4002260706',
        }),
      ],
      [makeRecebidoMultiLote({ quantidadeRecebida: 700 })],
      produtos,
    );

    const faltas = divergencias.filter(
      (item) => item.tipoDivergencia === 'quantidade_menor',
    );

    expect(faltas).toHaveLength(1);
    expect(faltas[0]).toMatchObject({
      produtoId: 'prod-multi',
      quantidadeEsperada: 810 * 12,
      quantidadeRecebida: 700 * 12,
    });
  });

  it('gera uma unica divergencia produto_ausente quando SKU nao foi conferido', () => {
    const divergencias = calcularDivergencias(
      [
        makeEsperadoMultiLote({
          id: 'pre-1',
          quantidadeEsperada: 540,
          loteEsperado: '4002260704',
        }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 270,
          loteEsperado: '4002260706',
        }),
      ],
      [],
      produtos,
    );

    const ausentes = divergencias.filter(
      (item) => item.tipoDivergencia === 'produto_ausente',
    );

    expect(ausentes).toHaveLength(1);
    expect(ausentes[0]).toMatchObject({
      produtoId: 'prod-multi',
      quantidadeEsperada: 810 * 12,
      quantidadeRecebida: 0,
    });
  });
});

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
