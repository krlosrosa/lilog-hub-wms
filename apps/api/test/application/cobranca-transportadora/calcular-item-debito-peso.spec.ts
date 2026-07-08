import { describe, expect, it } from 'vitest';

import {
  calcularValorDebitoPorKg,
} from '../../../src/application/services/cobranca-transportadora/calcular-item-debito-peso.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const produtoMock: ProdutoRecord = {
  id: 'prod-1',
  sku: '540300492',
  produtoId: '540300492',
  descricao: 'Creatina',
  unidadesPorCaixa: 1,
  caixasPorPalete: 1,
  pesoBrutoUnidade: 0.24,
  pesoBrutoCaixa: null,
  pesoBrutoPalete: null,
  pesoLiquidoUnidade: 0.24,
  pesoLiquidoCaixa: null,
  pesoLiquidoPalete: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as ProdutoRecord;

describe('calcularValorDebitoPorKg', () => {
  it('calcula valor como custo por kg multiplicado pelo peso total', () => {
    const valor = calcularValorDebitoPorKg(
      176.15,
      { tipo: 'avaria', quantidade: 10, qtdConferida: 10 },
      produtoMock,
    );

    expect(valor).toBe(Number((176.15 * 10 * 0.24).toFixed(2)));
  });

  it('retorna null quando não há produto para calcular peso', () => {
    const valor = calcularValorDebitoPorKg(
      176.15,
      { tipo: 'avaria', quantidade: 10, qtdConferida: 10 },
      null,
    );

    expect(valor).toBeNull();
  });
});
