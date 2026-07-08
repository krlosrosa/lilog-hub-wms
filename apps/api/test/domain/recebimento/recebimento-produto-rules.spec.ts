import { describe, expect, it } from 'vitest';

import {
  resolveProdutoConferenciaConfig,
  validateConferirItemFields,
} from '../../../src/domain/services/recebimento-produto-rules.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const pvarProduto: ProdutoRecord = {
  produtoId: 'PVAR-001',
  sku: 'SKU-PVAR',
  descricao: 'Produto peso variável',
  empresa: 'EMP',
  categoria: 'seco',
  grupo: null,
  tipo: 'PVAR',
  ean: null,
  dum: null,
  shelfLife: null,
  pesoBrutoUnidade: null,
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

describe('resolveProdutoConferenciaConfig', () => {
  it('enables etiqueta requirement only for PVAR with parameter active', () => {
    const config = resolveProdutoConferenciaConfig(pvarProduto, true, true);

    expect(config.pesoVariavel).toBe(true);
    expect(config.exigirEtiquetaPesoVariavel).toBe(true);
  });

  it('does not require etiqueta when parameter is disabled', () => {
    const config = resolveProdutoConferenciaConfig(pvarProduto, true, false);

    expect(config.pesoVariavel).toBe(true);
    expect(config.exigirEtiquetaPesoVariavel).toBe(false);
  });
});

describe('validateConferirItemFields', () => {
  it('requires etiqueta when exigirEtiquetaPesoVariavel is true', () => {
    const config = resolveProdutoConferenciaConfig(pvarProduto, true, true);

    const errors = validateConferirItemFields(
      {
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 10,
      },
      config,
    );

    expect(errors).toContain(
      'Etiqueta é obrigatória para produtos de peso variável',
    );
  });

  it('accepts peso and etiqueta for PVAR when required', () => {
    const config = resolveProdutoConferenciaConfig(pvarProduto, true, true);

    const errors = validateConferirItemFields(
      {
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 10,
        etiquetaCodigo: 'ETQ-123',
      },
      config,
    );

    expect(errors).toEqual([]);
  });
});
