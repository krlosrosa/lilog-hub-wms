import { describe, expect, it } from 'vitest';

import {
  buildCentrosPorCodigo,
  mapSubtipoToCategoria,
  montarAnomaliasRecebimentoPainel,
  normalizarOrigemPreRecebimento,
  resolverNomeCentro,
} from '../../../src/application/services/recebimento/montar-anomalias-recebimento-painel.js';
import type { RecebimentoPainelAnomaliaRow } from '../../../src/domain/repositories/recebimento/recebimento-painel.repository.js';

const CENTROS_FIXTURE = [
  { centro: '3201', nome: 'CD São Paulo' },
  { centro: '3102', nome: 'CD Campinas' },
];

function criarAnomalia(
  overrides: Partial<RecebimentoPainelAnomaliaRow> = {},
): RecebimentoPainelAnomaliaRow {
  return {
    id: 'item-1',
    subtipoOcorrencia: 'falta',
    origem: '3201',
    placa: 'ABC1D23',
    recebimentoId: 'rec-1',
    preRecebimentoId: 'pre-1',
    createdAt: new Date('2026-07-11T10:00:00Z'),
    ...overrides,
  };
}

describe('montarAnomaliasRecebimentoPainel', () => {
  it('deve agrupar subtipos nas quatro categorias do painel', () => {
    const resultado = montarAnomaliasRecebimentoPainel(
      [
        criarAnomalia({ id: '1', subtipoOcorrencia: 'falta' }),
        criarAnomalia({
          id: '2',
          subtipoOcorrencia: 'produto_nao_previsto',
          recebimentoId: 'rec-2',
          preRecebimentoId: 'pre-2',
        }),
        criarAnomalia({
          id: '3',
          subtipoOcorrencia: 'avaria',
          recebimentoId: 'rec-3',
          preRecebimentoId: 'pre-3',
        }),
        criarAnomalia({
          id: '4',
          subtipoOcorrencia: 'peso_divergente',
          recebimentoId: 'rec-4',
          preRecebimentoId: 'pre-4',
        }),
      ],
      CENTROS_FIXTURE,
    );

    expect(resultado.resumo.totalOcorrencias).toBe(4);
    expect(resultado.resumo.recebimentosAfetados).toBe(4);
    expect(resultado.resumo.porCategoria).toEqual([
      { categoria: 'falta', label: 'Falta', count: 1 },
      { categoria: 'sobra', label: 'Sobra', count: 1 },
      { categoria: 'avaria', label: 'Avaria', count: 1 },
      {
        categoria: 'divergencia_peso',
        label: 'Divergência de peso',
        count: 1,
      },
    ]);
  });

  it('deve montar ranking por origem do pre_recebimento com nome do centro', () => {
    const resultado = montarAnomaliasRecebimentoPainel(
      [
        criarAnomalia({ id: '1', origem: '3102', recebimentoId: 'rec-1' }),
        criarAnomalia({ id: '2', origem: '3102', recebimentoId: 'rec-2' }),
        criarAnomalia({ id: '3', origem: '3201', recebimentoId: 'rec-3' }),
        criarAnomalia({ id: '4', origem: null, recebimentoId: 'rec-4' }),
      ],
      CENTROS_FIXTURE,
    );

    expect(resultado.rankingOrigens).toEqual([
      { centro: '3102', nome: 'CD Campinas', count: 2, percentual: 50 },
      { centro: '3201', nome: 'CD São Paulo', count: 2, percentual: 50 },
    ]);
  });

  it('deve ignorar lote e validade divergente no total', () => {
    const resultado = montarAnomaliasRecebimentoPainel(
      [
        criarAnomalia({ id: '1', subtipoOcorrencia: 'lote_divergente' }),
        criarAnomalia({ id: '2', subtipoOcorrencia: 'validade_divergente' }),
        criarAnomalia({ id: '3', subtipoOcorrencia: 'falta' }),
      ],
      CENTROS_FIXTURE,
    );

    expect(resultado.resumo.totalOcorrencias).toBe(1);
    expect(resultado.rankingOrigens).toEqual([
      { centro: '3201', nome: 'CD São Paulo', count: 1, percentual: 100 },
    ]);
  });
});

describe('buildCentrosPorCodigo', () => {
  it('deve normalizar char(4) com espaços', () => {
    const map = buildCentrosPorCodigo([
      { centro: '3201   ', nome: 'CD São Paulo' },
    ]);

    expect(map['3201']).toBe('CD São Paulo');
    expect(resolverNomeCentro('3201', map)).toBe('CD São Paulo');
  });
});

describe('mapSubtipoToCategoria', () => {
  it('deve mapear produto_nao_previsto para sobra', () => {
    expect(mapSubtipoToCategoria('produto_nao_previsto')).toBe('sobra');
  });
});

describe('normalizarOrigemPreRecebimento', () => {
  it('deve usar 3201 quando origem estiver vazia', () => {
    expect(normalizarOrigemPreRecebimento(null)).toBe('3201');
    expect(normalizarOrigemPreRecebimento('   ')).toBe('3201');
  });
});
