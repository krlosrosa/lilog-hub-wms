import { describe, expect, it } from 'vitest';

import {
  buildSessaoFuncionariosComDemanda,
  demandaPertenceAoOperador,
  getDemandasAtivasDoOperador,
} from '../../../../src/application/services/recebimento/resolve-demandas-ativas-operador.js';

const SESSAO_FUNCIONARIO_ID = 'sf-1';
const FUNCIONARIO_ID = 42;

describe('resolve-demandas-ativas-operador', () => {
  describe('demandaPertenceAoOperador', () => {
    it('retorna false para demanda disponivel', () => {
      expect(
        demandaPertenceAoOperador(
          {
            statusDemanda: 'disponivel',
            alocacao: null,
            conferente: null,
          },
          SESSAO_FUNCIONARIO_ID,
          FUNCIONARIO_ID,
        ),
      ).toBe(false);
    });

    it('retorna true quando alocacao aponta para o operador', () => {
      expect(
        demandaPertenceAoOperador(
          {
            statusDemanda: 'atribuida',
            alocacao: { sessaoFuncionarioId: SESSAO_FUNCIONARIO_ID },
            conferente: null,
          },
          SESSAO_FUNCIONARIO_ID,
          FUNCIONARIO_ID,
        ),
      ).toBe(true);
    });

    it('retorna true via conferente quando em_conferencia sem alocacao', () => {
      expect(
        demandaPertenceAoOperador(
          {
            statusDemanda: 'em_conferencia',
            alocacao: null,
            conferente: { id: FUNCIONARIO_ID },
          },
          SESSAO_FUNCIONARIO_ID,
          FUNCIONARIO_ID,
        ),
      ).toBe(true);
    });

    it('retorna false quando conferente e diferente do operador', () => {
      expect(
        demandaPertenceAoOperador(
          {
            statusDemanda: 'em_conferencia',
            alocacao: null,
            conferente: { id: 99 },
          },
          SESSAO_FUNCIONARIO_ID,
          FUNCIONARIO_ID,
        ),
      ).toBe(false);
    });
  });

  describe('getDemandasAtivasDoOperador', () => {
    it('filtra demandas ativas do operador por alocacao e conferente', () => {
      const demandas = [
        {
          id: 'd1',
          statusDemanda: 'atribuida',
          alocacao: { sessaoFuncionarioId: SESSAO_FUNCIONARIO_ID },
          conferente: null,
        },
        {
          id: 'd2',
          statusDemanda: 'em_conferencia',
          alocacao: null,
          conferente: { id: FUNCIONARIO_ID },
        },
        {
          id: 'd3',
          statusDemanda: 'disponivel',
          alocacao: null,
          conferente: null,
        },
        {
          id: 'd4',
          statusDemanda: 'em_conferencia',
          alocacao: null,
          conferente: { id: 99 },
        },
      ];

      const result = getDemandasAtivasDoOperador(
        demandas,
        SESSAO_FUNCIONARIO_ID,
        FUNCIONARIO_ID,
      );

      expect(result.map((item) => item.id)).toEqual(['d1', 'd2']);
    });
  });

  describe('buildSessaoFuncionariosComDemanda', () => {
    it('inclui operador via conferente quando nao ha alocacao', () => {
      const result = buildSessaoFuncionariosComDemanda(
        [
          {
            statusDemanda: 'em_conferencia',
            alocacao: null,
            conferente: { id: FUNCIONARIO_ID },
          },
        ],
        [{ id: SESSAO_FUNCIONARIO_ID, funcionarioId: FUNCIONARIO_ID }],
      );

      expect([...result]).toEqual([SESSAO_FUNCIONARIO_ID]);
    });

    it('prioriza alocacao quando presente', () => {
      const result = buildSessaoFuncionariosComDemanda(
        [
          {
            statusDemanda: 'atribuida',
            alocacao: { sessaoFuncionarioId: 'sf-outro' },
            conferente: null,
          },
        ],
        [{ id: SESSAO_FUNCIONARIO_ID, funcionarioId: FUNCIONARIO_ID }],
      );

      expect([...result]).toEqual(['sf-outro']);
    });
  });
});
