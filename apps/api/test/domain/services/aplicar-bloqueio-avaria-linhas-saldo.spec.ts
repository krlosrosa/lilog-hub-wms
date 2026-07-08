import { describe, expect, it } from 'vitest';

import {
  aplicarBloqueioAvariaNasLinhasSaldo,
  buildAvariaBloqueioKeys,
  linhaMatchesAvariaBloqueio,
} from '../../../src/domain/services/aplicar-bloqueio-avaria-linhas-saldo.js';
import type { LinhaSaldoRecebimentoClassificada } from '../../../src/domain/services/classificar-linhas-saldo-recebimento.js';
import type { RecebimentoAvariaRecord } from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';

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

function makeAvaria(
  overrides: Partial<RecebimentoAvariaRecord> = {},
): RecebimentoAvariaRecord {
  return {
    id: 'av-1',
    recebimentoId: 'rec-1',
    produtoId: 'prod-1',
    lote: 'L1',
    validade: null,
    numeroSerie: null,
    tipo: 'fisica',
    natureza: 'parcial',
    causa: 'transporte',
    quantidadeCaixas: 1,
    quantidadeUnidades: 0,
    photoCount: 0,
    replicado: false,
    operatorId: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('aplicarBloqueioAvariaNasLinhasSaldo', () => {
  it('bloqueia apenas linhas com produto+lote correspondente à avaria', () => {
    const linhas = [
      makeLinha({ lote: 'L1' }),
      makeLinha({ lote: 'L2' }),
    ];

    const result = aplicarBloqueioAvariaNasLinhasSaldo(linhas, [
      makeAvaria({ lote: 'L1' }),
    ]);

    expect(result[0]).toMatchObject({
      lote: 'L1',
      status: 'bloqueado',
      tipoAnomalia: 'avaria',
    });
    expect(result[1]).toMatchObject({
      lote: 'L2',
      status: 'liberado',
      tipoAnomalia: null,
    });
  });

  it('bloqueia todas as linhas do produto quando avaria não informa lote', () => {
    const linhas = [
      makeLinha({ lote: 'L1' }),
      makeLinha({ lote: 'L2' }),
    ];

    const result = aplicarBloqueioAvariaNasLinhasSaldo(linhas, [
      makeAvaria({ lote: null }),
    ]);

    expect(result.every((linha) => linha.status === 'bloqueado')).toBe(true);
    expect(result.every((linha) => linha.tipoAnomalia === 'avaria')).toBe(true);
  });

  it('não altera linhas já bloqueadas', () => {
    const linhas = [
      makeLinha({
        lote: 'L1',
        status: 'bloqueado',
        tipoAnomalia: 'sobra',
      }),
    ];

    const result = aplicarBloqueioAvariaNasLinhasSaldo(linhas, [
      makeAvaria({ lote: 'L1' }),
    ]);

    expect(result[0]).toMatchObject({
      status: 'bloqueado',
      tipoAnomalia: 'sobra',
    });
  });

  it('retorna linhas inalteradas quando não há avarias', () => {
    const linhas = [makeLinha()];

    expect(aplicarBloqueioAvariaNasLinhasSaldo(linhas, [])).toEqual(linhas);
  });
});

describe('buildAvariaBloqueioKeys', () => {
  it('ignora avarias sem produtoId', () => {
    const keys = buildAvariaBloqueioKeys([
      makeAvaria({ produtoId: null }),
      makeAvaria({ produtoId: 'prod-1', lote: 'L1' }),
    ]);

    expect(keys.has('prod-1|L1')).toBe(true);
    expect(keys.size).toBe(1);
  });
});

describe('linhaMatchesAvariaBloqueio', () => {
  it('combina lote normalizado', () => {
    const keys = buildAvariaBloqueioKeys([makeAvaria({ lote: ' L1 ' })]);

    expect(
      linhaMatchesAvariaBloqueio(makeLinha({ lote: 'L1' }), keys),
    ).toBe(true);
  });
});
