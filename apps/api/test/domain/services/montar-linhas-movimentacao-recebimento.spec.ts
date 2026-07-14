import { describe, expect, it } from 'vitest';

import {
  MovimentacaoLoteContabilError,
  alocarMovimentacaoLotes,
  assertLotesContabeisInformados,
  buildDemandaFisica,
  buildPoolContabil,
  montarLinhasMovimentacaoProduto,
  type MontarLinhasMovimentacaoProdutoInput,
} from '../../../src/domain/services/montar-linhas-movimentacao-recebimento.js';
import type {
  MovimentacaoAvariaRecord,
  MovimentacaoConferidoRecord,
  MovimentacaoEsperadoRecord,
} from '../../../src/infra/db/recebimento/get-itens-movimentacao.drizzle.js';

function makeEsperado(
  overrides: Partial<MovimentacaoEsperadoRecord> = {},
): MovimentacaoEsperadoRecord {
  return {
    preRecebimentoId: 'pre-1',
    produtoId: 'prod-1',
    quantidadeEsperada: 10,
    unidadeMedida: 'CX',
    pesoEsperado: null,
    loteEsperado: 'LOTE-A',
    validadeEsperada: null,
    ...overrides,
  };
}

function makeConferido(
  overrides: Partial<MovimentacaoConferidoRecord> = {},
): MovimentacaoConferidoRecord {
  return {
    preRecebimentoId: 'pre-1',
    recebimentoId: 'rec-1',
    produtoId: 'prod-1',
    sku: 'SKU-001',
    empresa: 'LDB',
    tipo: 'NORMAL',
    unidadesPorCaixa: 12,
    pesoBrutoCaixa: null,
    loteRecebido: 'LOTE-B',
    quantidadeRecebida: 10,
    unidadeMedida: 'CX',
    pesoRecebido: null,
    validade: null,
    ...overrides,
  };
}

function makeInput(
  overrides: Partial<MontarLinhasMovimentacaoProdutoInput> = {},
): MontarLinhasMovimentacaoProdutoInput {
  return {
    produtoId: 'prod-1',
    sku: 'SKU-001',
    tipo: 'NORMAL',
    unidadesPorCaixa: 12,
    pesoBrutoCaixa: null,
    conferidosProduto: [makeConferido()],
    esperadosProduto: [makeEsperado()],
    avarias: [],
    ...overrides,
  };
}

describe('assertLotesContabeisInformados', () => {
  it('bloqueia quando não há linhas contábeis', () => {
    expect(() => assertLotesContabeisInformados([], 'SKU-001')).toThrow(
      MovimentacaoLoteContabilError,
    );
  });

  it('bloqueia quando alguma linha não tem loteEsperado', () => {
    expect(() =>
      assertLotesContabeisInformados(
        [makeEsperado({ loteEsperado: null })],
        'SKU-001',
      ),
    ).toThrow(/lote contábil/i);
  });

  it('bloqueia quando loteEsperado é vazio', () => {
    expect(() =>
      assertLotesContabeisInformados(
        [makeEsperado({ loteEsperado: '   ' })],
        'SKU-001',
      ),
    ).toThrow(/lote contábil/i);
  });
});

describe('buildPoolContabil', () => {
  it('agrupa saldo por lote contábil', () => {
    const pool = buildPoolContabil(
      [
        makeEsperado({ loteEsperado: 'A', quantidadeEsperada: 5 }),
        makeEsperado({ loteEsperado: 'A', quantidadeEsperada: 3 }),
        makeEsperado({ loteEsperado: 'B', quantidadeEsperada: 2 }),
      ],
      12,
    );

    expect(pool).toEqual([
      { lote: 'A', saldo: 8, validadeEsperada: null },
      { lote: 'B', saldo: 2, validadeEsperada: null },
    ]);
  });

  it('ordena pool por validadeEsperada ascendente (lote mais antigo primeiro)', () => {
    const pool = buildPoolContabil(
      [
        makeEsperado({
          loteEsperado: 'NOVO',
          quantidadeEsperada: 7,
          validadeEsperada: new Date('2026-12-01'),
        }),
        makeEsperado({
          loteEsperado: 'ANTIGO',
          quantidadeEsperada: 3,
          validadeEsperada: new Date('2026-01-01'),
        }),
      ],
      12,
    );

    expect(pool).toEqual([
      {
        lote: 'ANTIGO',
        saldo: 3,
        validadeEsperada: new Date('2026-01-01'),
      },
      {
        lote: 'NOVO',
        saldo: 7,
        validadeEsperada: new Date('2026-12-01'),
      },
    ]);
  });
});

describe('buildDemandaFisica', () => {
  it('atribui quantidade conferida integral por lote físico', () => {
    const conferidos = [
      makeConferido({ loteRecebido: 'B', quantidadeRecebida: 6 }),
      makeConferido({ loteRecebido: 'C', quantidadeRecebida: 4 }),
    ];

    const demanda = buildDemandaFisica(
      conferidos,
      10,
      12,
      (item) => item.quantidadeRecebida,
    );

    expect(demanda).toEqual([
      { loteDestino: 'B', quantidade: 6 },
      { loteDestino: 'C', quantidade: 4 },
    ]);
  });

  it('preenche lotes físicos em ordem FEFO até esgotar movimentarTotal', () => {
    const conferidos = [
      makeConferido({
        loteRecebido: '4251250730',
        quantidadeRecebida: 90,
        validade: new Date('2026-01-01'),
      }),
      makeConferido({
        loteRecebido: '5212250910',
        quantidadeRecebida: 50,
        validade: new Date('2026-06-01'),
      }),
      makeConferido({
        loteRecebido: '7621260412',
        quantidadeRecebida: 60,
        validade: new Date('2026-12-01'),
      }),
    ];

    const demanda = buildDemandaFisica(
      conferidos,
      200,
      12,
      (item) => item.quantidadeRecebida,
      undefined,
      { arredondarInteiro: true },
    );

    expect(demanda).toEqual([
      { loteDestino: '4251250730', quantidade: 90 },
      { loteDestino: '5212250910', quantidade: 50 },
      { loteDestino: '7621260412', quantidade: 60 },
    ]);
  });

  it('limita pelo saldo restante quando movimentarTotal é menor que o conferido', () => {
    const conferidos = [
      makeConferido({ loteRecebido: 'B', quantidadeRecebida: 90 }),
      makeConferido({ loteRecebido: 'C', quantidadeRecebida: 50 }),
      makeConferido({ loteRecebido: 'D', quantidadeRecebida: 60 }),
    ];

    const demanda = buildDemandaFisica(
      conferidos,
      150,
      12,
      (item) => item.quantidadeRecebida,
      undefined,
      { arredondarInteiro: true },
    );

    expect(demanda).toEqual([
      { loteDestino: 'B', quantidade: 90 },
      { loteDestino: 'C', quantidade: 50 },
      { loteDestino: 'D', quantidade: 10 },
    ]);
  });

  it('atribui quantidades inteiras por lote sem ponderação', () => {
    const conferidos = [
      makeConferido({ loteRecebido: 'B', quantidadeRecebida: 3 }),
      makeConferido({ loteRecebido: 'C', quantidadeRecebida: 2 }),
    ];

    const demanda = buildDemandaFisica(
      conferidos,
      6,
      12,
      (item) => item.quantidadeRecebida,
      undefined,
      { arredondarInteiro: true },
    );

    expect(demanda).toEqual([
      { loteDestino: 'B', quantidade: 3 },
      { loteDestino: 'C', quantidade: 2 },
    ]);
  });
});

describe('alocarMovimentacaoLotes', () => {
  it('aloca FIFO quando há múltiplos lotes contábeis', () => {
    const linhas = alocarMovimentacaoLotes(
      [
        { lote: 'A', saldo: 3, validadeEsperada: null },
        { lote: 'B', saldo: 5, validadeEsperada: null },
      ],
      [
        { loteDestino: 'X', quantidade: 4 },
        { loteDestino: 'Y', quantidade: 3 },
      ],
      'SKU-001',
    );

    expect(linhas).toEqual([
      { loteOrigem: 'A', loteDestino: 'X', quantidade: 3 },
      { loteOrigem: 'B', loteDestino: 'X', quantidade: 1 },
      { loteOrigem: 'B', loteDestino: 'Y', quantidade: 3 },
    ]);
  });

  it('lança erro quando pool contábil é insuficiente', () => {
    expect(() =>
      alocarMovimentacaoLotes(
        [{ lote: 'A', saldo: 2, validadeEsperada: null }],
        [{ loteDestino: 'X', quantidade: 5 }],
        'SKU-001',
      ),
    ).toThrow(/saldo contábil insuficiente/i);
  });
});

describe('montarLinhasMovimentacaoProduto', () => {
  it('gera linha com lote contábil na origem e físico no destino', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [makeEsperado({ loteEsperado: 'LOTE-A' })],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 10 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 10 },
    ]);
  });

  it('atribui quantidade conferida integral para cada lote físico', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 10 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 6 }),
          makeConferido({ loteRecebido: 'LOTE-C', quantidadeRecebida: 4 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 6 },
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-C', quantidade: 4 },
    ]);
  });

  it('usa FIFO com 2 contábeis e 2 físicos', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 3 }),
          makeEsperado({ loteEsperado: 'LOTE-B', quantidadeEsperada: 7 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-X', quantidadeRecebida: 4 }),
          makeConferido({ loteRecebido: 'LOTE-Y', quantidadeRecebida: 6 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-X', quantidade: 3 },
      { loteOrigem: 'LOTE-B', loteDestino: 'LOTE-X', quantidade: 1 },
      { loteOrigem: 'LOTE-B', loteDestino: 'LOTE-Y', quantidade: 6 },
    ]);
  });

  it('prioriza lote contábil mais antigo (FEFO) e o restante vai para os mais novos', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({
            loteEsperado: 'LOTE-NOVO',
            quantidadeEsperada: 7,
            validadeEsperada: new Date('2026-12-01'),
          }),
          makeEsperado({
            loteEsperado: 'LOTE-ANTIGO',
            quantidadeEsperada: 3,
            validadeEsperada: new Date('2026-01-01'),
          }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-FISICO', quantidadeRecebida: 10 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      {
        loteOrigem: 'LOTE-ANTIGO',
        loteDestino: 'LOTE-FISICO',
        quantidade: 3,
      },
      {
        loteOrigem: 'LOTE-NOVO',
        loteDestino: 'LOTE-FISICO',
        quantidade: 7,
      },
    ]);
  });

  it('limita movimentação à quantidade contábil quando físico é maior', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 8 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 12 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 8 },
    ]);
  });

  it('abatimento de avaria antes do rateio', () => {
    const avarias: MovimentacaoAvariaRecord[] = [
      {
        recebimentoId: 'rec-1',
        produtoId: 'prod-1',
        lote: 'LOTE-B',
        quantidadeCaixas: 2,
        quantidadeUnidades: 0,
      },
    ];

    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 10 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 10 }),
        ],
        avarias,
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 8 },
    ]);
  });

  it('bloqueia quando loteEsperado está ausente', () => {
    expect(() =>
      montarLinhasMovimentacaoProduto(
        makeInput({
          esperadosProduto: [makeEsperado({ loteEsperado: null })],
        }),
      ),
    ).toThrow(MovimentacaoLoteContabilError);
  });

  it('bloqueia quando não há linhas contábeis', () => {
    expect(() =>
      montarLinhasMovimentacaoProduto(
        makeInput({
          esperadosProduto: [],
        }),
      ),
    ).toThrow(/nenhuma linha contábil/i);
  });

  it('gera linhas PVAR com peso e lotes divergentes', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        tipo: 'PVAR',
        pesoBrutoCaixa: 10,
        esperadosProduto: [
          makeEsperado({
            loteEsperado: 'LOTE-A',
            quantidadeEsperada: 0,
            pesoEsperado: 100,
          }),
        ],
        conferidosProduto: [
          makeConferido({
            tipo: 'PVAR',
            loteRecebido: 'LOTE-B',
            quantidadeRecebida: 0,
            pesoRecebido: 60,
          }),
          makeConferido({
            tipo: 'PVAR',
            loteRecebido: 'LOTE-C',
            quantidadeRecebida: 0,
            pesoRecebido: 40,
          }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 60 },
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-C', quantidade: 40 },
    ]);
  });

  it('retorna vazio quando movimentarTotal é zero', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 0 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 0 }),
        ],
      }),
    );

    expect(linhas).toEqual([]);
  });

  it('modo CX arredonda movimentarTotal e gera quantidades inteiras', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        unidadesPorCaixa: 10,
        config: { displayUnidadePadrao: 'CX' },
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 10 }),
        ],
        conferidosProduto: [
          makeConferido({
            loteRecebido: 'LOTE-B',
            quantidadeRecebida: 57,
            unidadeMedida: 'UN',
          }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 6 },
    ]);
  });

  it('modo CX ajusta o último lote físico para fechar o total inteiro', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        config: { displayUnidadePadrao: 'CX' },
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 10 }),
        ],
        conferidosProduto: [
          makeConferido({ loteRecebido: 'LOTE-B', quantidadeRecebida: 3 }),
          makeConferido({ loteRecebido: 'LOTE-C', quantidadeRecebida: 2 }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 3 },
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-C', quantidade: 2 },
    ]);

    const somaQuantidades = linhas.reduce(
      (total, linha) => total + linha.quantidade,
      0,
    );
    expect(somaQuantidades).toBe(5);
    expect(linhas.every((linha) => Number.isInteger(linha.quantidade))).toBe(
      true,
    );
  });

  it('modo UN mantém comportamento com decimais (regressão)', () => {
    const linhas = montarLinhasMovimentacaoProduto(
      makeInput({
        unidadesPorCaixa: 10,
        config: { displayUnidadePadrao: 'UN' },
        esperadosProduto: [
          makeEsperado({ loteEsperado: 'LOTE-A', quantidadeEsperada: 10 }),
        ],
        conferidosProduto: [
          makeConferido({
            loteRecebido: 'LOTE-B',
            quantidadeRecebida: 57,
            unidadeMedida: 'UN',
          }),
        ],
      }),
    );

    expect(linhas).toEqual([
      { loteOrigem: 'LOTE-A', loteDestino: 'LOTE-B', quantidade: 5.7 },
    ]);
  });
});
