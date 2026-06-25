import { describe, expect, it } from 'vitest';

import {
  calcularScoreCriticidade,
  inferirNivelRisco,
} from '../../../src/application/services/expedicao/torre-controle/calcular-criticidade-transporte.js';
import { montarSnapshotTorreControle } from '../../../src/application/services/expedicao/torre-controle/montar-snapshot-torre-controle.js';
import type { TorreControleReadModel } from '../../../src/domain/repositories/expedicao/torre-controle.repository.js';

function criarTransporteReadModel(
  overrides: Partial<TorreControleReadModel['transportes'][number]> = {},
) {
  return {
    transporteId: 't-1',
    unidadeId: 'unidade-1',
    uploadLoteId: 'lote-1',
    codigo: '101',
    placa: 'ABC-1234',
    transportadora: 'TransLog',
    horarioExpectativaSaida: new Date('2026-06-22T10:00:00Z'),
    statusAlocacao: 'pendente',
    etapaAtual: 'separacao' as const,
    mapasTotal: 2,
    mapasConcluidos: 0,
    prioridade: true,
    isPrioridade: true,
    nivelPrioridade: 'urgente' as const,
    reentregaExclusiva: false,
    tempoRestanteSaidaMin: -5,
    tempoRestanteSaidaSeg: -5 * 60,
    pesoTotalKg: 1250.5,
    viagemId: null,
    viagemInicioEm: null,
    viagemFimEm: null,
    anomalia: null,
    ...overrides,
  };
}

describe('calcular-criticidade-transporte prioridade manual', () => {
  it('score urgente é maior que baixa quando isPrioridade', () => {
    const base = {
      prioridade: true,
      isPrioridade: true,
      tempoRestanteSaidaMin: 25,
      tempoEstimadoFinalizarMin: 40,
      nivelRisco: 'critico' as const,
      etapaAtual: 'separacao' as const,
    };

    const urgente = calcularScoreCriticidade({
      ...base,
      nivelPrioridade: 'urgente',
    });
    const baixa = calcularScoreCriticidade({
      ...base,
      nivelPrioridade: 'baixa',
    });

    expect(urgente).toBeGreaterThan(baixa);
  });

  it('reentrega exclusiva sem prioridade manual usa limiar padrão', () => {
    const nivel = inferirNivelRisco({
      prioridade: true,
      isPrioridade: false,
      nivelPrioridade: null,
      tempoRestanteSaidaMin: 18,
      tempoEstimadoFinalizarMin: 10,
    });

    expect(nivel).toBe('critico');
  });
});

describe('montarSnapshotTorreControle prioridade', () => {
  it('conta prioridade manual e reentrega exclusiva no KPI', () => {
    const readModel: TorreControleReadModel = {
      turno: {
        uploadLoteId: 'lote-1',
        unidadeId: 'unidade-1',
        dataReferencia: '2026-06-22',
        horarioExpectativaSaida: new Date('2026-06-22T12:00:00Z'),
        turnoInicioEm: new Date('2026-06-22T06:00:00Z'),
        totalTransportes: 2,
        transportesFinalizados: 0,
        mapasPendentes: 2,
        mapasFinalizados: 0,
        pesoTotalKg: '1000',
        pesoFinalizadoKg: '0',
      },
      transportes: [
        criarTransporteReadModel({
          transporteId: 't-manual',
          isPrioridade: true,
          reentregaExclusiva: false,
          prioridade: true,
        }),
        criarTransporteReadModel({
          transporteId: 't-reentrega',
          codigo: '202',
          isPrioridade: false,
          reentregaExclusiva: true,
          prioridade: true,
          nivelPrioridade: null,
        }),
      ],
      pipeline: [],
      mapasPendentes: [],
      mapasOperacionais: [],
      mapasHorarios: [],
      timeline: [],
      paletesPorTransporte: new Map([
        ['t-manual', 3],
        ['t-reentrega', 5],
      ]),
    };

    const snapshot = montarSnapshotTorreControle(readModel);
    const kpiPrioridades = snapshot.kpis.find(
      (kpi) => kpi.id === 'prioridades-pendentes',
    );

    expect(kpiPrioridades?.value).toBe('2');
    expect(snapshot.transportes).toHaveLength(2);
    expect(snapshot.transportes[0]?.isPrioridade).toBe(true);
    expect(snapshot.transportes[0]?.status).toBe('PENDENTE');
    expect(snapshot.transportes[1]?.reentregaExclusiva).toBe(true);
    expect(snapshot.transportes[0]?.horariosProcessos.separacao).toEqual({
      inicio: null,
      fim: null,
    });
    expect(snapshot.transportes[0]?.volumePaletes).toBe(3);
    expect(snapshot.transportes[1]?.volumePaletes).toBe(5);
  });

  it('gera alerta prioridade_atrasada quando meta estourada', () => {
    const readModel: TorreControleReadModel = {
      turno: null,
      transportes: [
        criarTransporteReadModel({
          tempoRestanteSaidaMin: -10,
          etapaAtual: 'conferencia',
        }),
      ],
      pipeline: [],
      mapasPendentes: [],
      mapasOperacionais: [],
      mapasHorarios: [],
      timeline: [],
      paletesPorTransporte: new Map(),
    };

    const snapshot = montarSnapshotTorreControle(readModel);

    expect(
      snapshot.alertas.some((alerta) => alerta.tipo === 'prioridade_atrasada'),
    ).toBe(true);
  });
});
