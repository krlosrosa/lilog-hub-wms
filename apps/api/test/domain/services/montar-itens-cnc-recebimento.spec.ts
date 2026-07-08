import { describe, expect, it } from 'vitest';

import { montarItensCncRecebimento } from '../../../src/domain/services/montar-itens-cnc-recebimento.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const produto: ProdutoRecord = {
  produtoId: 'prod-1',
  sku: 'SKU-001',
  descricao: 'Produto teste',
  empresa: 'lilog',
  categoria: 'alimentos',
  grupo: null,
  tipo: 'revenda',
  ean: null,
  dum: null,
  shelfLife: null,
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

describe('montarItensCncRecebimento', () => {
  it('deve montar item de falta com quantidades e produto', () => {
    const itens = montarItensCncRecebimento({
      divergencias: [
        {
          id: 'div-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipoDivergencia: 'quantidade_menor',
          quantidadeEsperada: 100,
          quantidadeRecebida: 88,
          descricao: 'Quantidade recebida abaixo da prevista',
          createdAt: new Date(),
        },
      ],
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-1',
          quantidadeEsperada: 100,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
          loteEsperado: 'LOTE-A',
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 88,
          unidadeMedida: 'UN',
          loteRecebido: 'LOTE-A',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      tipo: 'divergencia',
      subtipoOcorrencia: 'falta',
      sku: 'SKU-001',
      quantidadeDivergente: 12,
      loteEsperado: 'LOTE-A',
      loteRecebido: 'LOTE-A',
      responsavelSugerido: 'fornecedor',
    });
  });

  it('deve montar item de avaria com natureza e quantidades', () => {
    const itens = montarItensCncRecebimento({
      divergencias: [],
      avarias: [
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipo: 'embalagem',
          natureza: 'transporte',
          causa: 'impacto',
          quantidadeCaixas: 2,
          quantidadeUnidades: 24,
          photoCount: 1,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ],
      itensEsperados: [],
      itensRecebidos: [],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens[0]).toMatchObject({
      tipo: 'avaria',
      subtipoOcorrencia: 'avaria',
      quantidadeDivergente: 24,
      naturezaAvaria: 'transporte',
      responsavelSugerido: 'transportadora',
    });
  });

  it('nao deve montar item CNC para divergencia de lote', () => {
    const itens = montarItensCncRecebimento({
      divergencias: [
        {
          id: 'div-lote',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipoDivergencia: 'divergencia_lote',
          quantidadeEsperada: null,
          quantidadeRecebida: null,
          descricao: 'Lote esperado LOTE-A, recebido LOTE-B',
          createdAt: new Date(),
        },
      ],
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-1',
          quantidadeEsperada: 100,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
          loteEsperado: 'LOTE-A',
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 100,
          unidadeMedida: 'UN',
          loteRecebido: 'LOTE-B',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(0);
  });

  it('deve montar apenas falta quando houver falta e divergencia de lote', () => {
    const itens = montarItensCncRecebimento({
      divergencias: [
        {
          id: 'div-falta',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipoDivergencia: 'quantidade_menor',
          quantidadeEsperada: 100,
          quantidadeRecebida: 88,
          descricao: 'Quantidade recebida abaixo da prevista',
          createdAt: new Date(),
        },
        {
          id: 'div-lote',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          tipoDivergencia: 'divergencia_lote',
          quantidadeEsperada: null,
          quantidadeRecebida: null,
          descricao: 'Lote esperado LOTE-A, recebido LOTE-B',
          createdAt: new Date(),
        },
      ],
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-1',
          quantidadeEsperada: 100,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
          loteEsperado: 'LOTE-A',
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId: 'prod-1',
          quantidadeRecebida: 88,
          unidadeMedida: 'UN',
          loteRecebido: 'LOTE-B',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      tipo: 'divergencia',
      subtipoOcorrencia: 'falta',
      quantidadeDivergente: 12,
    });
  });
});
