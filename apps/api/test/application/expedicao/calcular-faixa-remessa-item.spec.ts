import { describe, expect, it } from 'vitest';

import {
  calcularFaixaRemessaItem,
  calcularPercentualVidaUtilRestante,
  classificarFaixaRemessaItem,
} from '../../../src/application/services/expedicao/calcular-faixa-remessa-item.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const produtoBase: ProdutoRecord = {
  id: 'prod-1',
  produtoId: 'P001',
  sku: 'SKU001',
  descricao: 'Produto teste',
  empresa: 'LDB',
  categoria: 'seco',
  tipo: 'UN',
  ean: null,
  dum: null,
  shelfLife: 100,
  pesoBrutoUnidade: null,
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: null,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  unidadesPorCaixa: 12,
  caixasPorPalete: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function dataFabricacaoComPercentual(
  dataReferencia: string,
  shelfLife: number,
  percentualAlvo: number,
): string {
  const [year, month, day] = dataReferencia.split('-').map(Number);
  const referencia = new Date(Date.UTC(year, month - 1, day));
  const diasRestantes = (percentualAlvo / 100) * shelfLife;
  const diasDecorridos = shelfLife - diasRestantes;
  const fabricacao = new Date(
    referencia.getTime() - diasDecorridos * 24 * 60 * 60 * 1000,
  );

  return fabricacao.toISOString().slice(0, 10);
}

describe('calcularPercentualVidaUtilRestante', () => {
  it('retorna 100% quando a data de referência é igual à fabricação', () => {
    expect(
      calcularPercentualVidaUtilRestante('2026-06-01', '2026-06-01', 100),
    ).toBe(100);
  });

  it('retorna 0% quando o produto atingiu o shelf life', () => {
    expect(
      calcularPercentualVidaUtilRestante('2026-03-01', '2026-06-09', 100),
    ).toBe(0);
  });
});

describe('classificarFaixaRemessaItem', () => {
  it('classifica vermelho até 17,99%', () => {
    expect(classificarFaixaRemessaItem(17.99)).toBe('vermelho');
    expect(classificarFaixaRemessaItem(0)).toBe('vermelho');
  });

  it('classifica laranja acima de 17,99% até 32,99%', () => {
    expect(classificarFaixaRemessaItem(18)).toBe('laranja');
    expect(classificarFaixaRemessaItem(32.99)).toBe('laranja');
  });

  it('classifica amarelo acima de 32,99% até 49,99%', () => {
    expect(classificarFaixaRemessaItem(33)).toBe('amarelo');
    expect(classificarFaixaRemessaItem(49.99)).toBe('amarelo');
  });

  it('classifica verde acima de 49,99%', () => {
    expect(classificarFaixaRemessaItem(50)).toBe('verde');
    expect(classificarFaixaRemessaItem(100)).toBe('verde');
  });
});

describe('calcularFaixaRemessaItem', () => {
  const dataReferencia = '2026-06-19';

  it('retorna null sem data de fabricação', () => {
    expect(
      calcularFaixaRemessaItem(null, dataReferencia, produtoBase),
    ).toBeNull();
  });

  it('retorna null sem shelf life do produto', () => {
    expect(
      calcularFaixaRemessaItem(
        '2026-06-01',
        dataReferencia,
        { ...produtoBase, shelfLife: null },
      ),
    ).toBeNull();
  });

  it('calcula faixa com base no shelf life e data de fabricação', () => {
    const dataFabricacao = dataFabricacaoComPercentual(
      dataReferencia,
      100,
      10,
    );

    expect(
      calcularFaixaRemessaItem(dataFabricacao, dataReferencia, produtoBase),
    ).toBe('vermelho');
  });

  it('calcula verde para produto com vida útil restante acima de 49,99%', () => {
    const dataFabricacao = dataFabricacaoComPercentual(
      dataReferencia,
      100,
      80,
    );

    expect(
      calcularFaixaRemessaItem(dataFabricacao, dataReferencia, produtoBase),
    ).toBe('verde');
  });
});
