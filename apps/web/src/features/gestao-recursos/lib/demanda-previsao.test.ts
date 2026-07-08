import { describe, expect, it } from 'vitest';

import {
  computeDemandaTimeline,
  computeProgressoMapas,
  getReferenciaOciosidadeIso,
  isOperatorLate,
} from '@/features/gestao-recursos/lib/demanda-previsao';
import type { DemandaSeparacaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { formatTimeFromIso } from '@/features/pausas/lib/pausas-mappers';

function buildDemanda(
  overrides: Partial<DemandaSeparacaoApi> & Pick<DemandaSeparacaoApi, 'id'>,
): DemandaSeparacaoApi {
  return {
    id: overrides.id,
    sessaoId: 'sessao-1',
    mapaGrupoId: `mapa-${overrides.id}`,
    mapaGrupoTitulo: overrides.mapaGrupoTitulo ?? `MAPA-${overrides.id}`,
    mapaGrupoMicroUuid: `micro-${overrides.id}`,
    mapaGrupoProcesso: overrides.mapaGrupoProcesso ?? 'separacao',
    transporteId: 'transporte-1',
    transporteRota: 'R01',
    sessaoFuncionarioId: 'sf-1',
    funcionarioId: 1,
    status: overrides.status ?? 'em_andamento',
    atribuidoEm: overrides.atribuidoEm ?? '2026-06-22T16:00:00.000Z',
    iniciadoEm: overrides.iniciadoEm ?? '2026-06-22T16:00:00.000Z',
    finalizadoEm: overrides.finalizadoEm ?? null,
    tempoEsperadoMinutos: overrides.tempoEsperadoMinutos ?? 720,
  };
}

describe('computeProgressoMapas', () => {
  it('retorna 0% quando nenhum mapa foi concluído', () => {
    const progresso = computeProgressoMapas([
      buildDemanda({ id: 'd1' }),
      buildDemanda({
        id: 'd2',
        status: 'pendente',
        atribuidoEm: '2026-06-22T16:01:00.000Z',
        iniciadoEm: null,
      }),
      buildDemanda({
        id: 'd3',
        status: 'pendente',
        atribuidoEm: '2026-06-22T16:02:00.000Z',
        iniciadoEm: null,
      }),
    ]);

    expect(progresso).toEqual({ progress: 0, concluidas: 0, total: 3 });
  });

  it('retorna 33% quando 1 de 3 mapas foi concluído', () => {
    const progresso = computeProgressoMapas([
      buildDemanda({
        id: 'd1',
        status: 'concluida',
        finalizadoEm: '2026-06-22T16:20:00.000Z',
      }),
      buildDemanda({
        id: 'd2',
        status: 'em_andamento',
        atribuidoEm: '2026-06-22T16:01:00.000Z',
        iniciadoEm: '2026-06-22T16:20:00.000Z',
      }),
      buildDemanda({
        id: 'd3',
        status: 'pendente',
        atribuidoEm: '2026-06-22T16:02:00.000Z',
        iniciadoEm: null,
      }),
    ]);

    expect(progresso).toEqual({ progress: 33, concluidas: 1, total: 3 });
  });
});

describe('computeDemandaTimeline', () => {
  it('calcula término de uma demanda como inicio + tempo previsto', () => {
    const iniciadoEm = '2026-06-22T16:00:00.000Z';
    const now = new Date('2026-06-22T16:05:00.000Z');

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          iniciadoEm,
          tempoEsperadoMinutos: 720,
        }),
      ],
      now,
    );

    expect(timeline.tasks).toHaveLength(1);
    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:12:00.000Z'),
    );
    expect(timeline.expectedEndTotal?.toISOString()).toBe(
      '2026-06-22T16:12:00.000Z',
    );
    expect(timeline.activeTaskProgress).toBe(0);
  });

  it('encadeia a segunda demanda no término previsto da primeira', () => {
    const now = new Date('2026-06-22T16:05:00.000Z');

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 480,
          status: 'pendente',
        }),
      ],
      now,
    );

    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:12:00.000Z'),
    );
    expect(timeline.tasks[1]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:12:00.000Z'),
    );
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:20:00.000Z'),
    );
  });

  it('usa progresso agregado por mapas concluídos', () => {
    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          status: 'concluida',
          finalizadoEm: '2026-06-22T16:12:00.000Z',
        }),
        buildDemanda({
          id: 'd2',
          status: 'em_andamento',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: '2026-06-22T16:12:00.000Z',
        }),
        buildDemanda({
          id: 'd3',
          status: 'pendente',
          atribuidoEm: '2026-06-22T16:02:00.000Z',
          iniciadoEm: null,
        }),
      ],
      new Date('2026-06-22T16:15:00.000Z'),
    );

    expect(timeline.activeTaskProgress).toBe(33);
    expect(timeline.tasks).toHaveLength(2);
  });

  it('marca operador atrasado quando now passa do término da demanda em andamento', () => {
    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
      ],
      new Date('2026-06-22T16:15:00.000Z'),
    );

    expect(
      isOperatorLate(timeline.activeTaskEnd, new Date('2026-06-22T16:15:00.000Z')),
    ).toBe(true);
    expect(timeline.tasks[0]?.isLate).toBe(true);
  });

  it('usa término da última demanda como expectativa total', () => {
    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 660,
          status: 'pendente',
        }),
      ],
      new Date('2026-06-22T16:05:00.000Z'),
    );

    expect(formatTimeFromIso(timeline.expectedEndTotal!.toISOString())).toBe(
      formatTimeFromIso('2026-06-22T16:23:00.000Z'),
    );
  });

  it('replaneja fila a partir de agora + 1 min quando mapa anterior está atrasado', () => {
    const now = new Date('2026-06-22T16:15:00.000Z');

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 480,
          status: 'pendente',
        }),
        buildDemanda({
          id: 'd3',
          atribuidoEm: '2026-06-22T16:02:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 600,
          status: 'pendente',
        }),
      ],
      now,
    );

    expect(timeline.tasks[0]?.isLate).toBe(true);
    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:12:00.000Z'),
    );
    expect(timeline.tasks[1]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:16:00.000Z'),
    );
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:24:00.000Z'),
    );
    expect(timeline.tasks[2]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:24:00.000Z'),
    );
    expect(timeline.tasks[2]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:34:00.000Z'),
    );
    expect(timeline.expectedEndTotal?.toISOString()).toBe(
      '2026-06-22T16:34:00.000Z',
    );
  });

  it('desloca fila pelo tempo da pausa ativa sem duplicar nos mapas seguintes', () => {
    const now = new Date('2026-06-22T16:05:00.000Z');
    const pausaDeslocamentoMs = 5 * 60_000;

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 480,
          status: 'pendente',
        }),
      ],
      now,
      { pausaDeslocamentoMs },
    );

    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:17:00.000Z'),
    );
    expect(timeline.tasks[0]?.pausaExtraMinutos).toBe(5);
    expect(timeline.tasks[1]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:17:00.000Z'),
    );
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:25:00.000Z'),
    );
    expect(timeline.expectedEndTotal?.toISOString()).toBe(
      '2026-06-22T16:25:00.000Z',
    );
  });

  it('aplica pausa apenas no mapa em andamento, nao no primeiro pendente', () => {
    const now = new Date('2026-06-22T16:05:00.000Z');
    const pausaDeslocamentoMs = 4 * 60_000;

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 600,
          status: 'pendente',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: '2026-06-22T16:01:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
      ],
      now,
      { pausaDeslocamentoMs },
    );

    expect(timeline.tasks[0]?.pausaExtraMinutos).toBeUndefined();
    expect(timeline.tasks[1]?.pausaExtraMinutos).toBe(4);
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:17:00.000Z'),
    );
  });

  it('encadeia fila mesmo quando varias demandas estao em_andamento na API', () => {
    const now = new Date('2026-06-22T16:38:00.000Z');

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 354,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 138,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd3',
          atribuidoEm: '2026-06-22T16:02:00.000Z',
          iniciadoEm: '2026-06-22T16:02:00.000Z',
          tempoEsperadoMinutos: 360,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd4',
          atribuidoEm: '2026-06-22T16:03:00.000Z',
          iniciadoEm: '2026-06-22T16:02:00.000Z',
          tempoEsperadoMinutos: 120,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd5',
          atribuidoEm: '2026-06-22T16:04:00.000Z',
          iniciadoEm: '2026-06-22T16:02:00.000Z',
          tempoEsperadoMinutos: 204,
          status: 'em_andamento',
        }),
      ],
      now,
    );

    expect(timeline.tasks).toHaveLength(5);
    expect(timeline.tasks[0]?.status).toBe('em_andamento');
    expect(
      timeline.tasks.slice(1).every((task) => task.status === 'pendente'),
    ).toBe(true);
    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:05:54.000Z'),
    );
    expect(timeline.tasks[1]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:39:00.000Z'),
    );
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:41:18.000Z'),
    );
    expect(timeline.tasks[2]?.startTime).toBe(
      timeline.tasks[1]?.expectedEndTime,
    );
    expect(timeline.tasks[3]?.startTime).toBe(
      timeline.tasks[2]?.expectedEndTime,
    );
    expect(timeline.tasks[4]?.startTime).toBe(
      timeline.tasks[3]?.expectedEndTime,
    );
    expect(formatTimeFromIso(timeline.expectedEndTotal!.toISOString())).toBe(
      timeline.tasks[4]?.expectedEndTime,
    );
  });

  it('combina replanejamento por atraso com deslocamento de pausa ativa', () => {
    const now = new Date('2026-06-22T16:16:00.000Z');
    const pausaDeslocamentoMs = 3 * 60_000;

    const timeline = computeDemandaTimeline(
      [
        buildDemanda({
          id: 'd1',
          atribuidoEm: '2026-06-22T16:00:00.000Z',
          iniciadoEm: '2026-06-22T16:00:00.000Z',
          tempoEsperadoMinutos: 720,
          status: 'em_andamento',
        }),
        buildDemanda({
          id: 'd2',
          atribuidoEm: '2026-06-22T16:01:00.000Z',
          iniciadoEm: null,
          tempoEsperadoMinutos: 480,
          status: 'pendente',
        }),
      ],
      now,
      { pausaDeslocamentoMs },
    );

    expect(timeline.tasks[0]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:15:00.000Z'),
    );
    expect(timeline.tasks[1]?.startTime).toBe(
      formatTimeFromIso('2026-06-22T16:17:00.000Z'),
    );
    expect(timeline.tasks[1]?.expectedEndTime).toBe(
      formatTimeFromIso('2026-06-22T16:25:00.000Z'),
    );
  });
});

describe('getReferenciaOciosidadeIso', () => {
  const checkIn = '2026-06-22T08:00:00.000Z';

  it('usa check-in quando nenhuma demanda foi iniciada', () => {
    const referencia = getReferenciaOciosidadeIso(checkIn, [
      buildDemanda({
        id: 'd1',
        status: 'pendente',
        iniciadoEm: null,
      }),
    ]);

    expect(referencia).toBe(checkIn);
  });

  it('usa finalizadoEm da ultima demanda concluida quando existir', () => {
    const referencia = getReferenciaOciosidadeIso(checkIn, [
      buildDemanda({
        id: 'd1',
        status: 'concluida',
        iniciadoEm: '2026-06-22T09:00:00.000Z',
        finalizadoEm: '2026-06-22T09:30:00.000Z',
      }),
      buildDemanda({
        id: 'd2',
        status: 'concluida',
        iniciadoEm: '2026-06-22T10:00:00.000Z',
        finalizadoEm: '2026-06-22T10:45:00.000Z',
        atribuidoEm: '2026-06-22T09:31:00.000Z',
      }),
    ]);

    expect(referencia).toBe('2026-06-22T10:45:00.000Z');
  });

  it('usa check-in quando nao ha demandas', () => {
    expect(getReferenciaOciosidadeIso(checkIn, [])).toBe(checkIn);
  });
});
