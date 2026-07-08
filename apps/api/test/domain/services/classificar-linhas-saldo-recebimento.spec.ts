import { describe, expect, it } from 'vitest';

import {
  classificarLinhasSaldoRecebimento,
} from '../../../src/domain/services/classificar-linhas-saldo-recebimento.js';
import type { DivergenciaRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';

function makeItem(
  overrides: Partial<ItemRecebimentoRecord> = {},
): ItemRecebimentoRecord {
  return {
    id: 'item-1',
    recebimentoId: 'rec-1',
    produtoId: 'prod-1',
    quantidadeRecebida: 10,
    unidadeMedida: 'UN',
    loteRecebido: 'L1',
    pesoRecebido: null,
    validade: null,
    numeroSerie: null,
    unitizadorId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeDivergencia(
  overrides: Partial<DivergenciaRecebimentoRecord> = {},
): DivergenciaRecebimentoRecord {
  return {
    id: 'div-1',
    recebimentoId: 'rec-1',
    produtoId: 'prod-1',
    tipoDivergencia: 'quantidade_menor',
    quantidadeEsperada: 10,
    quantidadeRecebida: 8,
    descricao: 'Falta',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('classificarLinhasSaldoRecebimento', () => {
  it('deve classificar linha liberada quando não há divergência', () => {
    const linhas = classificarLinhasSaldoRecebimento({
      itensConferidos: [makeItem()],
      divergencias: [],
      unidadesPorCaixaMap: new Map([['prod-1', 1]]),
    });

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      produtoId: 'prod-1',
      quantidade: 10,
      status: 'liberado',
      tipoAnomalia: null,
    });
  });

  it('deve dividir sobra em linha liberada e bloqueada', () => {
    const linhas = classificarLinhasSaldoRecebimento({
      itensConferidos: [makeItem({ quantidadeRecebida: 12 })],
      divergencias: [
        makeDivergencia({
          id: 'div-sobra',
          tipoDivergencia: 'quantidade_maior',
          quantidadeEsperada: 10,
          quantidadeRecebida: 12,
        }),
      ],
      unidadesPorCaixaMap: new Map([['prod-1', 1]]),
    });

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatchObject({
      quantidade: 10,
      status: 'liberado',
      tipoAnomalia: null,
    });
    expect(linhas[1]).toMatchObject({
      quantidade: 2,
      status: 'bloqueado',
      tipoAnomalia: 'sobra',
    });
  });

  it('deve bloquear produto não esperado inteiro', () => {
    const linhas = classificarLinhasSaldoRecebimento({
      itensConferidos: [makeItem({ produtoId: 'prod-x' })],
      divergencias: [
        makeDivergencia({
          id: 'div-ne',
          produtoId: 'prod-x',
          tipoDivergencia: 'produto_nao_esperado',
        }),
      ],
      unidadesPorCaixaMap: new Map([['prod-x', 1]]),
    });

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      status: 'bloqueado',
      tipoAnomalia: 'produto_nao_esperado',
    });
  });
});
