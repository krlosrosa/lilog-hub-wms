import { describe, expect, it } from 'vitest';

import {
  buildLotesFromConferidosApi,
  splitQuantidadeRecebidaParaConferenciaForm,
} from './recebimento-conferencia-rascunho';

describe('splitQuantidadeRecebidaParaConferenciaForm', () => {
  it('converte unidades normalizadas para caixas quando quantidadeModo é caixa', () => {
    expect(
      splitQuantidadeRecebidaParaConferenciaForm({
        quantidadeRecebida: 24,
        unidadeMedida: 'UN',
        quantidadeModo: 'caixa',
        unidadesPorCaixa: 24,
      }),
    ).toEqual({ recebidaCaixa: 1, recebidaUnidade: 0 });
  });

  it('mantém unidades quando quantidadeModo é unidade', () => {
    expect(
      splitQuantidadeRecebidaParaConferenciaForm({
        quantidadeRecebida: 24,
        unidadeMedida: 'UN',
        quantidadeModo: 'unidade',
        unidadesPorCaixa: 24,
      }),
    ).toEqual({ recebidaCaixa: 0, recebidaUnidade: 24 });
  });

  it('divide caixas e unidades quando quantidadeModo é ambos', () => {
    expect(
      splitQuantidadeRecebidaParaConferenciaForm({
        quantidadeRecebida: 26,
        unidadeMedida: 'UN',
        quantidadeModo: 'ambos',
        unidadesPorCaixa: 24,
      }),
    ).toEqual({ recebidaCaixa: 1, recebidaUnidade: 2 });
  });
});

describe('buildLotesFromConferidosApi', () => {
  it('reidrata 1 caixa conferida a partir de 24 unidades normalizadas', () => {
    const lotes = buildLotesFromConferidosApi(
      [
        {
          id: 'item-1',
          produtoId: 'prod-1',
          recebimentoItemId: 'item-1',
          quantidadeRecebida: 24,
          unidadeMedida: 'UN',
          sku: 'SKU-1',
          descricao: 'Produto teste',
          unidadesPorCaixa: 24,
          config: {
            controlaLote: true,
            controlaValidade: false,
            controlaPeso: false,
            pesoVariavel: false,
            exigirEtiquetaPesoVariavel: false,
            controlaNumeroSerie: false,
          },
          loteRecebido: 'L001',
          validade: null,
          unitizadorCodigo: null,
          unitizadorId: null,
          pesoRecebido: null,
          etiquetaCodigo: null,
          pesagemId: null,
        },
      ],
      'caixa',
      24,
    );

    expect(lotes[0]?.recebidaCaixa).toBe(1);
    expect(lotes[0]?.recebidaUnidade).toBe(0);
  });
});
