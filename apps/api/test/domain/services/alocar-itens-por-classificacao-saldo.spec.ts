import { describe, expect, it } from 'vitest';

import { createAlocadorSaldoClassificado } from '../../../src/domain/services/alocar-itens-por-classificacao-saldo.js';
import type { LinhaSaldoRecebimentoClassificada } from '../../../src/domain/services/classificar-linhas-saldo-recebimento.js';

function makeLinha(
  overrides: Partial<LinhaSaldoRecebimentoClassificada> = {},
): LinhaSaldoRecebimentoClassificada {
  return {
    produtoId: 'prod-1',
    quantidade: 10,
    unidadeMedida: 'UN',
    lote: 'L1',
    validade: null,
    numeroSerie: null,
    status: 'liberado',
    tipoAnomalia: null,
    ...overrides,
  };
}

describe('createAlocadorSaldoClassificado', () => {
  it('retorna item único liberado quando não há classificação mista', () => {
    const alocador = createAlocadorSaldoClassificado([
      makeLinha({ quantidade: 10 }),
    ]);

    const result = alocador.alocar({
      produtoId: 'prod-1',
      quantidade: 10,
      unidadeMedida: 'UN',
      lote: 'L1',
      validade: null,
      numeroSerie: null,
    });

    expect(result).toEqual([
      expect.objectContaining({
        quantidade: 10,
        statusSaldo: 'liberado',
      }),
    ]);
  });

  it('divide palete com sobra em itens liberado e bloqueado', () => {
    const alocador = createAlocadorSaldoClassificado([
      makeLinha({ quantidade: 10, status: 'liberado' }),
      makeLinha({
        quantidade: 2,
        status: 'bloqueado',
        tipoAnomalia: 'sobra',
      }),
    ]);

    const result = alocador.alocar({
      produtoId: 'prod-1',
      quantidade: 12,
      unidadeMedida: 'UN',
      lote: 'L1',
      validade: null,
      numeroSerie: null,
    });

    expect(result).toEqual([
      expect.objectContaining({ quantidade: 10, statusSaldo: 'liberado' }),
      expect.objectContaining({ quantidade: 2, statusSaldo: 'bloqueado' }),
    ]);
  });

  it('distribui liberado e bloqueado entre múltiplos paletes', () => {
    const alocador = createAlocadorSaldoClassificado([
      makeLinha({ quantidade: 10, status: 'liberado' }),
      makeLinha({
        quantidade: 2,
        status: 'bloqueado',
        tipoAnomalia: 'sobra',
      }),
    ]);

    const palete1 = alocador.alocar({
      produtoId: 'prod-1',
      quantidade: 6,
      unidadeMedida: 'UN',
      lote: 'L1',
      validade: null,
      numeroSerie: null,
    });

    const palete2 = alocador.alocar({
      produtoId: 'prod-1',
      quantidade: 6,
      unidadeMedida: 'UN',
      lote: 'L1',
      validade: null,
      numeroSerie: null,
    });

    expect(palete1).toEqual([
      expect.objectContaining({ quantidade: 6, statusSaldo: 'liberado' }),
    ]);
    expect(palete2).toEqual([
      expect.objectContaining({ quantidade: 4, statusSaldo: 'liberado' }),
      expect.objectContaining({ quantidade: 2, statusSaldo: 'bloqueado' }),
    ]);
  });
});
