import { describe, expect, it } from 'vitest';

import {
  buildReferenciaIdCncQuantidade,
  montarDescricaoCnc,
  montarItensCncRecebimento,
} from '../../../src/domain/services/montar-itens-cnc-recebimento.js';
import type { ItemPreRecebimentoRecord } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

const RECEBIMENTO_ID = '11111111-1111-4111-8111-111111111111';

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

const pvarProduto: ProdutoRecord = {
  ...produto,
  produtoId: 'prod-pvar',
  sku: 'SKU-PVAR',
  tipo: 'PVAR',
  unidadesPorCaixa: 1,
  pesoBrutoUnidade: '1',
};

function makeEsperado(
  overrides: Partial<ItemPreRecebimentoRecord> = {},
): ItemPreRecebimentoRecord {
  return {
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
    ...overrides,
  };
}

function makeRecebido(
  overrides: Partial<ItemRecebimentoRecord> = {},
): ItemRecebimentoRecord {
  return {
    id: 'item-1',
    recebimentoId: RECEBIMENTO_ID,
    unidadeId: 'ITB',
    produtoId: 'prod-1',
    quantidadeRecebida: 88,
    unidadeMedida: 'UN',
    loteRecebido: 'LOTE-A',
    pesoRecebido: null,
    validade: null,
    numeroSerie: null,
    unitizadorId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

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
    recebimentoId: RECEBIMENTO_ID,
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

describe('montarItensCncRecebimento', () => {
  it('deve montar item de falta com quantidades e produto', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [makeEsperado()],
      itensRecebidos: [makeRecebido()],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      tipo: 'divergencia',
      subtipoOcorrencia: 'falta',
      sku: 'SKU-001',
      quantidadeDivergente: 12,
      unidadeMedida: 'UN',
      causaAvaria: '88',
      shelfLifeDias: 90,
      loteEsperado: 'LOTE-A',
      loteRecebido: 'LOTE-A',
      responsavelSugerido: 'fornecedor',
    });
  });

  it('deve montar item de avaria com natureza e quantidades', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [
        {
          id: 'av-1',
          recebimentoId: RECEBIMENTO_ID,
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
      quantidadeDivergente: 48,
      unidadeMedida: 'UN',
      shelfLifeDias: 90,
      naturezaAvaria: 'transporte',
      responsavelSugerido: 'transportadora',
    });
  });

  it('deve normalizar avaria registrada apenas em caixas para unidades', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [
        {
          id: 'av-2',
          recebimentoId: RECEBIMENTO_ID,
          produtoId: 'prod-1',
          tipo: 'embalagem',
          natureza: 'transporte',
          causa: 'impacto',
          quantidadeCaixas: 2,
          quantidadeUnidades: 0,
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
      quantidadeDivergente: 24,
      unidadeMedida: 'UN',
      quantidadeCaixas: 2,
      quantidadeUnidades: 0,
    });
  });

  it('nao deve montar item CNC quando apenas lote diverge e quantidade confere', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [makeEsperado({ loteEsperado: 'LOTE-A' })],
      itensRecebidos: [
        makeRecebido({ quantidadeRecebida: 100, loteRecebido: 'LOTE-B' }),
      ],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(0);
  });

  it('nao deve montar item quantidade para multi-lote quando total confere', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        makeEsperadoMultiLote({ id: 'pre-1', quantidadeEsperada: 540 }),
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
      itensRecebidos: [makeRecebidoMultiLote({ quantidadeRecebida: 810 })],
      produtos: new Map([['prod-multi', prodMultiLote]]),
    });

    expect(itens).toHaveLength(0);
  });

  it('deve montar uma unica falta para multi-lote abaixo do total', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        makeEsperadoMultiLote({ id: 'pre-1', quantidadeEsperada: 540 }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 270,
          loteEsperado: '4002260706',
        }),
      ],
      itensRecebidos: [makeRecebidoMultiLote({ quantidadeRecebida: 700 })],
      produtos: new Map([['prod-multi', prodMultiLote]]),
      displayConfig: {
        unidadePadrao: 'CX',
        decimaisCaixa: 2,
        decimaisUnidade: 0,
      },
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'falta',
      quantidadeDivergente: 110,
      unidadeMedida: 'CX',
    });
  });

  it('deve montar uma unica sobra para multi-lote acima do total', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        makeEsperadoMultiLote({ id: 'pre-1', quantidadeEsperada: 540 }),
        makeEsperadoMultiLote({
          id: 'pre-2',
          quantidadeEsperada: 90,
          loteEsperado: '4002260706',
        }),
      ],
      itensRecebidos: [makeRecebidoMultiLote({ quantidadeRecebida: 700 })],
      produtos: new Map([['prod-multi', prodMultiLote]]),
      displayConfig: {
        unidadePadrao: 'CX',
        decimaisCaixa: 2,
        decimaisUnidade: 0,
      },
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'sobra',
      quantidadeDivergente: 70,
      unidadeMedida: 'CX',
    });
  });

  it('deve calcular diff corretamente com linhas CX e UN do mesmo SKU', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [makeEsperadoMultiLote({ quantidadeEsperada: 100 })],
      itensRecebidos: [
        makeRecebidoMultiLote({
          id: 'item-1',
          quantidadeRecebida: 90,
          unidadeMedida: 'CX',
        }),
        makeRecebidoMultiLote({
          id: 'item-2',
          quantidadeRecebida: 120,
          unidadeMedida: 'UN',
        }),
      ],
      produtos: new Map([['prod-multi', prodMultiLote]]),
    });

    expect(itens).toHaveLength(0);
  });

  it('deve montar produto_nao_previsto para SKU somente no recebido', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [],
      itensRecebidos: [makeRecebido({ quantidadeRecebida: 5 })],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'produto_nao_previsto',
      quantidadeDivergente: 5,
    });
  });

  it('deve montar falta quando SKU esperado nao foi conferido', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [makeEsperado({ quantidadeEsperada: 50 })],
      itensRecebidos: [],
      produtos: new Map([['prod-1', produto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'falta',
      quantidadeDivergente: 50,
      quantidadeRecebida: 0,
    });
  });

  it('deve montar peso_divergente para PVAR sem falta ou sobra por quantidade', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-pvar',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-pvar',
          quantidadeEsperada: 10,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 1,
          loteEsperado: null,
          pesoEsperado: 10,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-pvar',
          recebimentoId: RECEBIMENTO_ID,
          unidadeId: 'ITB',
          produtoId: 'prod-pvar',
          quantidadeRecebida: 10,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: 8,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-pvar', pvarProduto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'peso_divergente',
      pesoEsperado: 10,
      pesoRecebido: 8,
      quantidadeDivergente: null,
    });
  });

  it('nao deve montar item quantidade para PVAR quando apenas quantidade diverge', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-pvar',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-pvar',
          quantidadeEsperada: 10,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 1,
          loteEsperado: null,
          pesoEsperado: 10,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-pvar',
          recebimentoId: RECEBIMENTO_ID,
          unidadeId: 'ITB',
          produtoId: 'prod-pvar',
          quantidadeRecebida: 8,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: 10,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-pvar', pvarProduto]]),
    });

    expect(itens).toHaveLength(0);
  });

  it('deve montar apenas peso_divergente para PVAR com quantidade e peso divergentes', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        {
          id: 'pre-item-pvar',
          preRecebimentoId: 'pre-1',
          produtoId: 'prod-pvar',
          quantidadeEsperada: 10,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 1,
          loteEsperado: null,
          pesoEsperado: 10,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensRecebidos: [
        {
          id: 'item-pvar',
          recebimentoId: RECEBIMENTO_ID,
          unidadeId: 'ITB',
          produtoId: 'prod-pvar',
          quantidadeRecebida: 8,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: 7,
          validade: null,
          numeroSerie: null,
          unitizadorId: null,
          createdAt: new Date(),
        },
      ],
      produtos: new Map([['prod-pvar', pvarProduto]]),
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      subtipoOcorrencia: 'peso_divergente',
    });
  });

  it('deve manter duas linhas de avaria para o mesmo produto', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [
        {
          id: 'av-1',
          recebimentoId: RECEBIMENTO_ID,
          produtoId: 'prod-1',
          tipo: 'embalagem',
          natureza: 'transporte',
          causa: 'impacto',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 1,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
        {
          id: 'av-2',
          recebimentoId: RECEBIMENTO_ID,
          produtoId: 'prod-1',
          tipo: 'embalagem',
          natureza: 'embalagem',
          causa: 'rasgo',
          quantidadeCaixas: 0,
          quantidadeUnidades: 6,
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

    expect(itens).toHaveLength(2);
    expect(itens.every((item) => item.tipo === 'avaria')).toBe(true);
  });

  it('deve converter quantidades para CX quando displayConfig preferir caixa', () => {
    const itens = montarItensCncRecebimento({
      recebimentoId: RECEBIMENTO_ID,
      avarias: [],
      itensEsperados: [
        makeEsperado({
          quantidadeEsperada: 105,
          unidadeMedida: 'CX',
        }),
      ],
      itensRecebidos: [
        makeRecebido({
          quantidadeRecebida: 4,
          unidadeMedida: 'CX',
        }),
      ],
      produtos: new Map([['prod-1', produto]]),
      displayConfig: {
        unidadePadrao: 'CX',
        decimaisCaixa: 2,
        decimaisUnidade: 0,
      },
    });

    expect(itens[0]).toMatchObject({
      quantidadeEsperada: 105,
      quantidadeRecebida: 4,
      quantidadeDivergente: 101,
      unidadeMedida: 'CX',
    });
  });
});

describe('buildReferenciaIdCncQuantidade', () => {
  it('deve gerar uuid deterministico para o mesmo input', () => {
    const first = buildReferenciaIdCncQuantidade(
      RECEBIMENTO_ID,
      'prod-1',
      'falta',
    );
    const second = buildReferenciaIdCncQuantidade(
      RECEBIMENTO_ID,
      'prod-1',
      'falta',
    );

    expect(first).toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe('montarDescricaoCnc', () => {
  it('deve resumir subtipos dos itens', () => {
    const descricao = montarDescricaoCnc([
      {
        tipo: 'divergencia',
        referenciaId: '00000000-0000-4000-8000-000000000001',
        subtipoOcorrencia: 'falta',
      },
      {
        tipo: 'avaria',
        referenciaId: '00000000-0000-4000-8000-000000000002',
        subtipoOcorrencia: 'avaria',
      },
    ]);

    expect(descricao).toBe(
      'CNC gerada automaticamente (1 falta, 1 avaria)',
    );
  });
});
