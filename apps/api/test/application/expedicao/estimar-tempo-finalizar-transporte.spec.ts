import { describe, expect, it } from 'vitest';

import {
  estimarTempoFinalizarTransporteMin,
  estimarTempoFinalizarTransporteSeg,
} from '../../../src/application/services/expedicao/torre-controle/estimar-tempo-finalizar-transporte.js';
import type { VwMapasPendentesRow } from '../../../src/domain/repositories/expedicao/torre-controle.repository.js';

function mapaPendente(
  overrides: Partial<VwMapasPendentesRow> & Pick<VwMapasPendentesRow, 'transporteId'>,
): VwMapasPendentesRow {
  return {
    mapaGrupoId: 'grupo-1',
    mapaLoteId: 'lote-1',
    unidadeId: 'unidade-1',
    uploadLoteId: 'upload-1',
    transporteCodigo: 'TR-001',
    microUuid: 'micro-1',
    processo: 'separacao',
    titulo: 'Separação',
    iniciadoEm: null,
    tempoEsperadoSeg: 1217,
    tempoParadoSeg: 840,
    operadorNome: null,
    sessaoFuncionarioId: null,
    prioridade: false,
    isPrioridade: false,
    nivelPrioridade: null,
    reentregaExclusiva: false,
    ...overrides,
  };
}

describe('estimarTempoFinalizarTransporteSeg', () => {
  it('soma o tempo previsto fixo de cada mapa pendente, sem descontar parado', () => {
    const transporteId = 'transporte-1';

    const total = estimarTempoFinalizarTransporteSeg(transporteId, [
      mapaPendente({
        transporteId,
        tempoEsperadoSeg: 1217,
        tempoParadoSeg: 840,
      }),
    ]);

    expect(total).toBe(1217);
  });

  it('soma tempos previstos de todos os mapas pendentes do transporte', () => {
    const transporteId = 'transporte-1';

    const total = estimarTempoFinalizarTransporteSeg(transporteId, [
      mapaPendente({
        transporteId,
        tempoEsperadoSeg: 600,
        tempoParadoSeg: 120,
      }),
      mapaPendente({
        transporteId,
        mapaGrupoId: 'grupo-2',
        tempoEsperadoSeg: 900,
        tempoParadoSeg: 300,
      }),
    ]);

    expect(total).toBe(1500);
  });

  it('ignora mapas de outros transportes', () => {
    const total = estimarTempoFinalizarTransporteSeg('transporte-1', [
      mapaPendente({
        transporteId: 'transporte-2',
        tempoEsperadoSeg: 9999,
        tempoParadoSeg: 0,
      }),
    ]);

    expect(total).toBe(0);
  });
});

describe('estimarTempoFinalizarTransporteMin', () => {
  it('converte segundos previstos para minutos arredondados para cima', () => {
    const total = estimarTempoFinalizarTransporteMin('transporte-1', [
      mapaPendente({
        transporteId: 'transporte-1',
        tempoEsperadoSeg: 1217,
        tempoParadoSeg: 840,
      }),
    ]);

    expect(total).toBe(21);
  });
});
