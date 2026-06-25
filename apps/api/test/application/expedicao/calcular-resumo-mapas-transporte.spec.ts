import { describe, expect, it } from 'vitest';

import {
  calcularResumoMapasTransporte,
  transporteSeparacaoNaoIniciada,
} from '../../../src/application/services/expedicao/torre-controle/calcular-resumo-mapas-transporte.js';
import type { MapaOperacionalRow } from '../../../src/domain/repositories/expedicao/torre-controle.repository.js';

function criarMapa(
  overrides: Partial<MapaOperacionalRow> & Pick<MapaOperacionalRow, 'mapaGrupoId'>,
): MapaOperacionalRow {
  return {
    transporteId: 't-1',
    transporteCodigo: '101',
    processo: 'separacao',
    titulo: 'MAP-001',
    sequencia: 1,
    iniciadoEm: null,
    finalizadoEm: null,
    tempoParadoSeg: 0,
    operadorNome: null,
    prioridade: false,
    ...overrides,
  };
}

describe('calcularResumoMapasTransporte', () => {
  it('conta mapas finalizados sobre o total operacional do transporte', () => {
    const mapas = [
      criarMapa({ mapaGrupoId: 'm-1', finalizadoEm: new Date() }),
      criarMapa({ mapaGrupoId: 'm-2', finalizadoEm: new Date() }),
      criarMapa({ mapaGrupoId: 'm-3', processo: 'conferencia' }),
      criarMapa({ mapaGrupoId: 'm-4', transporteId: 't-2' }),
    ];

    expect(calcularResumoMapasTransporte(mapas, 't-1')).toEqual({
      mapasTotal: 3,
      mapasConcluidos: 2,
    });
  });

  it('retorna zero quando transporte não possui mapas', () => {
    expect(calcularResumoMapasTransporte([], 't-1')).toEqual({
      mapasTotal: 0,
      mapasConcluidos: 0,
    });
  });
});

describe('transporteSeparacaoNaoIniciada', () => {
  it('identifica transporte prioritário sem separação iniciada', () => {
    const mapas = [
      criarMapa({ mapaGrupoId: 'm-1' }),
      criarMapa({ mapaGrupoId: 'm-2' }),
    ];

    expect(transporteSeparacaoNaoIniciada(mapas, 't-1')).toBe(true);
  });

  it('retorna false quando algum mapa de separação foi iniciado', () => {
    const mapas = [
      criarMapa({ mapaGrupoId: 'm-1', iniciadoEm: new Date() }),
      criarMapa({ mapaGrupoId: 'm-2' }),
    ];

    expect(transporteSeparacaoNaoIniciada(mapas, 't-1')).toBe(false);
  });
});
