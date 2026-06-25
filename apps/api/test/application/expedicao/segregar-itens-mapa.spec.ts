import { describe, expect, it } from 'vitest';

import { segregarItensConsolidados } from '../../../src/application/services/expedicao/segregar-itens-mapa.js';
import type { ItemMapaSegregavel } from '../../../src/application/services/expedicao/segregar-itens-mapa.js';

const PESOS = {
  unidade: '0.500',
  caixa: '6.000',
  palete: '120.000',
} as const;

function criarItem(
  overrides: Partial<ItemMapaSegregavel> = {},
): ItemMapaSegregavel {
  return {
    sku: 'SKU001',
    descricao: 'Produto teste',
    remessa: 'R001',
    cliente: 'Cliente A',
    codCliente: 'C001',
    empresa: 'Empresa X',
    categoria: 'seco',
    lote: 'L001',
    dataFabricacao: '2026-01-01',
    faixa: 'verde',
    quantidade: 265,
    unidadeMedida: 'UN',
    quantidadeNormalizadaUnidades: 265,
    peso: 252.5,
    unidadesPorCaixa: 12,
    caixasPorPalete: 10,
    pesoBrutoUnidade: PESOS.unidade,
    pesoBrutoCaixa: PESOS.caixa,
    pesoBrutoPalete: PESOS.palete,
    pesoLiquidoUnidade: null,
    pesoLiquidoCaixa: null,
    pesoLiquidoPalete: null,
    ...overrides,
  };
}

describe('segregarItensConsolidados', () => {
  it('retorna um grupo quando nenhuma segregacao esta ativa', () => {
    const item = criarItem();
    const grupos = segregarItensConsolidados([item], {
      segregarPaleteFull: false,
      segregarUnidade: false,
    });

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.itens).toEqual([item]);
  });

  it('segrega paletes completos do restante', () => {
    const item = criarItem({ quantidadeNormalizadaUnidades: 132, quantidade: 132, peso: 126 });
    const grupos = segregarItensConsolidados([item], {
      segregarPaleteFull: true,
      segregarUnidade: false,
    });

    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.sufixoTitulo).toBe(' — Paletes Completos');
    expect(grupos[0]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(120);
    expect(grupos[1]?.sufixoTitulo).toBe('');
    expect(grupos[1]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(12);
  });

  it('segrega unidades avulsas do restante', () => {
    const item = criarItem();
    const grupos = segregarItensConsolidados([item], {
      segregarPaleteFull: false,
      segregarUnidade: true,
    });

    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.sufixoTitulo).toBe(' — Unidades');
    expect(grupos[0]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(1);
    expect(grupos[1]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(264);
  });

  it('segrega paletes e unidades em tres grupos', () => {
    const item = criarItem();
    const grupos = segregarItensConsolidados([item], {
      segregarPaleteFull: true,
      segregarUnidade: true,
    });

    expect(grupos).toHaveLength(3);
    expect(grupos[0]?.sufixoTitulo).toBe(' — Paletes Completos');
    expect(grupos[0]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(240);
    expect(grupos[1]?.sufixoTitulo).toBe(' — Unidades');
    expect(grupos[1]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(1);
    expect(grupos[2]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(24);
  });

  it('mantem item no grupo normal quando nao ha paletes para segregar', () => {
    const item = criarItem({ quantidadeNormalizadaUnidades: 25, quantidade: 25 });
    const grupos = segregarItensConsolidados([item], {
      segregarPaleteFull: true,
      segregarUnidade: false,
    });

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.itens[0]?.quantidadeNormalizadaUnidades).toBe(25);
  });
});
