import { describe, expect, it } from 'vitest';

import { montarPipelineDetalheTransporte } from '@/features/torre-controle-expedicao/lib/resolver-pipeline-viagem';
import type { TransporteRisco } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

function criarTransporteBase(
  overrides: Partial<TransporteRisco> = {},
): TransporteRisco {
  return {
    id: 't-1',
    codigo: '101',
    placa: 'ABC-1234',
    transportadora: 'TransLog',
    prioridade: false,
    isPrioridade: false,
    nivelPrioridade: null,
    reentregaExclusiva: false,
    status: 'CARREGADO',
    etapaAtual: 'finalizado',
    horarioSaida: '24/06/2026 22:00',
    tempoRestanteSaidaMin: 30,
    tempoRestanteSaidaSeg: 30 * 60,
    tempoEstimadoFinalizarMin: 0,
    tempoEstimadoFinalizarSeg: 0,
    nivelRisco: 'baixo',
    scoreCriticidade: 0,
    mapasTotal: 2,
    mapasConcluidos: 2,
    volumePaletes: 0,
    pesoTotalKg: 0,
    statusProcessos: {
      separacao: 'concluido',
      conferencia: 'concluido',
      carregamento: 'concluido',
    },
    horariosProcessos: {
      separacao: { inicio: '20:00', fim: '20:30' },
      conferencia: { inicio: '20:30', fim: '21:00' },
      carregamento: { inicio: '21:00', fim: '21:30' },
    },
    ...overrides,
  };
}

describe('montarPipelineDetalheTransporte', () => {
  it('inclui horários de viagem após carregamento', () => {
    const etapas = montarPipelineDetalheTransporte(criarTransporteBase());

    expect(etapas.map((etapa) => etapa.key)).toEqual([
      'separacao',
      'conferencia',
      'carregamento',
      'viagem_inicio',
      'viagem_fim',
    ]);
  });

  it('exibe apenas horários nas etapas de viagem', () => {
    const etapas = montarPipelineDetalheTransporte(
      criarTransporteBase({
        viagemId: 1234567890,
        viagemInicioEm: '22:15',
        viagemFimEm: '23:40',
      }),
    );

    const inicio = etapas.find((etapa) => etapa.key === 'viagem_inicio');
    const fim = etapas.find((etapa) => etapa.key === 'viagem_fim');

    expect(inicio).toMatchObject({ modo: 'horario', horario: '22:15' });
    expect(fim).toMatchObject({ modo: 'horario', horario: '23:40' });
  });

  it('mantém status apenas nas etapas WMS', () => {
    const etapas = montarPipelineDetalheTransporte(criarTransporteBase());
    const separacao = etapas.find((etapa) => etapa.key === 'separacao');

    expect(separacao).toMatchObject({ modo: 'processo', status: 'concluido' });
  });
});
