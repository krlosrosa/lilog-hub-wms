import { describe, expect, it } from 'vitest';

import { aplicarQuebraPaleteItens } from '../../../src/application/services/expedicao/aplicar-quebra-palete-grupos.js';
import type { ItemMapaSegregavel } from '../../../src/application/services/expedicao/segregar-itens-mapa.js';

function criarItem(
  sku: string,
  qtdNorm: number,
  caixasPorPalete = 100,
): ItemMapaSegregavel {
  const unidadesPorCaixa = 12;

  return {
    sku,
    remessa: 'R001',
    cliente: 'Cliente A',
    codCliente: 'C001',
    empresa: 'Empresa X',
    categoria: 'seco',
    lote: null,
    dataFabricacao: null,
    faixa: null,
    quantidade: qtdNorm,
    unidadeMedida: 'UN',
    quantidadeNormalizadaUnidades: qtdNorm,
    peso: qtdNorm,
    unidadesPorCaixa,
    caixasPorPalete,
    pesoBrutoUnidade: '0.5',
    pesoBrutoCaixa: '6',
    pesoBrutoPalete: '120',
    pesoLiquidoUnidade: null,
    pesoLiquidoCaixa: null,
    pesoLiquidoPalete: null,
  };
}

describe('aplicarQuebraPaleteItens', () => {
  it('retorna um grupo quando quebra desativada', () => {
    const itens = [criarItem('A', 240), criarItem('B', 120)];

    const partes = aplicarQuebraPaleteItens(itens, {
      ativo: false,
      tipo: 'linhas',
      valor: 3,
    });

    expect(partes).toHaveLength(1);
    expect(partes[0]).toHaveLength(2);
  });

  it('quebra por linhas a cada N itens', () => {
    const itens = Array.from({ length: 7 }, (_, index) =>
      criarItem(`SKU${index}`, 12),
    );

    const partes = aplicarQuebraPaleteItens(itens, {
      ativo: true,
      tipo: 'linhas',
      valor: 3,
    });

    expect(partes).toHaveLength(3);
    expect(partes[0]).toHaveLength(3);
    expect(partes[1]).toHaveLength(3);
    expect(partes[2]).toHaveLength(1);
  });

  it('quebra por percentual acumulando caixas avulsas', () => {
    const item1 = criarItem('A', 20 * 12);
    const item2 = criarItem('B', 15 * 12);
    const item3 = criarItem('C', 30 * 12);

    const partes = aplicarQuebraPaleteItens([item1, item2, item3], {
      ativo: true,
      tipo: 'percentual',
      valor: 50,
    });

    expect(partes).toHaveLength(2);
    expect(partes[0]?.map((item) => item.sku)).toEqual(['A', 'B']);
    expect(partes[1]?.map((item) => item.sku)).toEqual(['C']);
  });

  it('ignora paletes no calculo percentual usando apenas breakdown.caixas', () => {
    const itemComPalete = criarItem('A', 120 + 20 * 12, 100);

    const partes = aplicarQuebraPaleteItens([itemComPalete], {
      ativo: true,
      tipo: 'percentual',
      valor: 50,
    });

    expect(partes).toHaveLength(1);
    expect(partes[0]).toHaveLength(1);
  });
});
