import type { TorreControleSnapshot } from '../../../dtos/expedicao/torre-controle.dto.js';
import type { TorreControleReadModel } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import {
  enriquecerTransporteOperacional,
  type EtapaOperacional,
} from './calcular-criticidade-transporte.js';
import { estimarTempoFinalizarTransporteSeg } from './estimar-tempo-finalizar-transporte.js';
import {
  calcularResumoMapasTransporte,
  transporteSeparacaoNaoIniciada,
} from './calcular-resumo-mapas-transporte.js';
import { resolverStatusProcessos } from './resolver-status-processos.js';
import { resolverHorariosProcessosPorTransporte } from './resolver-horarios-processos.js';
import { formatarDataHoraPtBr } from './formatar-data-hora-pt-br.js';

const ETAPA_LABELS: Record<EtapaOperacional, string> = {
  separacao: 'Separação',
  conferencia: 'Conferência',
  carregamento: 'Carregamento',
  finalizado: 'Finalizado',
};

const PIPELINE_ETAPAS: EtapaOperacional[] = [
  'separacao',
  'conferencia',
  'carregamento',
  'finalizado',
];

function formatarHora(date: Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatarMetaLargada(date: Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  return formatarDataHoraPtBr(date);
}

type ProcessoStatusMapa = 'pendente' | 'em_andamento' | 'concluido';

function resolverStatusMapa(mapa: {
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
}): ProcessoStatusMapa {
  if (mapa.finalizadoEm) {
    return 'concluido';
  }

  if (mapa.iniciadoEm) {
    return 'em_andamento';
  }

  return 'pendente';
}

function calcularProgressoTurno(inicio: Date, fim: Date, agora = new Date()): number {
  const total = fim.getTime() - inicio.getTime();
  if (total <= 0) {
    return 0;
  }

  const decorrido = agora.getTime() - inicio.getTime();
  return Math.min(100, Math.max(0, Math.round((decorrido / total) * 100)));
}

function montarPipeline(
  readModel: TorreControleReadModel,
  turnoFinalizados: number,
): TorreControleSnapshot['pipeline'] {
  const porProcesso = new Map(
    readModel.pipeline.map((row) => [row.processo, row]),
  );

  const pendentesPorEtapa = PIPELINE_ETAPAS.map(
    (etapa) => porProcesso.get(etapa as 'separacao' | 'conferencia' | 'carregamento')?.qtdMapasPendentes ?? 0,
  );

  const maxPendentes = Math.max(...pendentesPorEtapa, 1);

  const volumePaletesPorEtapa = (etapa: EtapaOperacional): number => {
    if (etapa === 'finalizado') {
      return 0;
    }

    return readModel.transportes
      .filter((transporte) => transporte.etapaAtual === etapa)
      .reduce(
        (total, transporte) =>
          total + (readModel.paletesPorTransporte.get(transporte.transporteId) ?? 0),
        0,
      );
  };

  return PIPELINE_ETAPAS.map((etapa) => {
    if (etapa === 'finalizado') {
      return {
        etapa,
        label: ETAPA_LABELS[etapa],
        qtdMapas: turnoFinalizados,
        tempoMedioParadoMin: 0,
        volumeAcumuladoPaletes: 0,
        capacidadeHora: 0,
        isGargalo: false,
        saturacaoPercent: 0,
      };
    }

    const row = porProcesso.get(etapa);
    const qtdMapas = row?.qtdMapasPendentes ?? 0;
    const tempoMedioParadoMin = row ? Number(row.tempoMedioParadoMin) : 0;
    const saturacaoPercent = Math.min(
      100,
      Math.round((qtdMapas / maxPendentes) * 100),
    );

    return {
      etapa,
      label: ETAPA_LABELS[etapa],
      qtdMapas,
      tempoMedioParadoMin,
      volumeAcumuladoPaletes: volumePaletesPorEtapa(etapa),
      capacidadeHora: 0,
      isGargalo: qtdMapas === maxPendentes && qtdMapas > 0,
      saturacaoPercent,
    };
  });
}

function montarRecursos(
  readModel: TorreControleReadModel,
): TorreControleSnapshot['recursos'] {
  type SetorRecurso = 'separacao' | 'conferencia' | 'carregamento' | 'expedicao';

  const setores: SetorRecurso[] = [
    'separacao',
    'conferencia',
    'carregamento',
    'expedicao',
  ];

  return setores.map((setor) => {
    const mapasSetor =
      setor === 'expedicao'
        ? []
        : readModel.mapasPendentes.filter((m) => m.processo === setor);

    const operadores = new Set(
      mapasSetor
        .map((m) => m.operadorNome)
        .filter((nome): nome is string => Boolean(nome)),
    );

    const operadoresAtivos =
      setor === 'expedicao'
        ? readModel.transportes.filter((t) => t.etapaAtual === 'finalizado').length
        : operadores.size;

    const operadoresTotal = Math.max(operadoresAtivos, 1);
    const qtdPendente =
      setor === 'expedicao'
        ? readModel.transportes.filter((t) => t.etapaAtual !== 'finalizado').length
        : mapasSetor.length;

    const saturacaoPercent = Math.min(
      100,
      qtdPendente > 0
        ? Math.round((qtdPendente / Math.max(operadoresTotal * 3, 1)) * 100)
        : 0,
    );

    const labels: Record<SetorRecurso, string> = {
      separacao: 'Separação',
      conferencia: 'Conferência',
      carregamento: 'Carregamento',
      expedicao: 'Expedição',
    };

    return {
      setor,
      label: labels[setor],
      operadoresAtivos,
      operadoresTotal,
      produtividadeHora: 0,
      metaProdutividadeHora: 0,
      saturacaoPercent,
    };
  });
}

function montarTimeline(
  readModel: TorreControleReadModel,
  turnoInicio: Date,
): TorreControleSnapshot['timeline'] {
  const pontos: TorreControleSnapshot['timeline'] = [
    {
      hora: formatarHora(turnoInicio),
      label: 'Início turno',
      tipo: 'inicio',
      volumeRelativo: 10,
    },
  ];

  const maxGrupos = Math.max(
    ...readModel.timeline.map((t) => t.gruposFinalizados),
    1,
  );

  for (const row of readModel.timeline) {
    pontos.push({
      hora: formatarHora(row.horaBucket),
      label: 'Finalizações',
      tipo: 'pico',
      volumeRelativo: Math.round((row.gruposFinalizados / maxGrupos) * 100),
    });
  }

  return pontos;
}

function montarAlertas(
  transportes: TorreControleSnapshot['transportes'],
  pipeline: TorreControleSnapshot['pipeline'],
  mapasOperacionais: TorreControleReadModel['mapasOperacionais'],
): TorreControleSnapshot['alertas'] {
  const alertas: TorreControleSnapshot['alertas'] = [];

  for (const transporte of transportes) {
    if (
      transporte.prioridade &&
      transporte.etapaAtual === 'separacao' &&
      transporteSeparacaoNaoIniciada(mapasOperacionais, transporte.id)
    ) {
      alertas.push({
        id: `al-prioridade-${transporte.id}`,
        tipo: 'prioridade_nao_iniciada',
        severity: 'error',
        title: `Prioridade ${transporte.codigo} não iniciada`,
        description: `Transporte prioritário ainda em ${ETAPA_LABELS.separacao}.`,
        timeAgo: 'agora',
        entityId: transporte.id,
        sectionId: 'painel-criticidade',
      });
    }

    if (
      transporte.prioridade &&
      transporte.tempoRestanteSaidaMin < 0 &&
      transporte.etapaAtual !== 'finalizado'
    ) {
      alertas.push({
        id: `al-prioridade-atrasada-${transporte.id}`,
        tipo: 'prioridade_atrasada',
        severity: 'error',
        title: `Prioridade ${transporte.codigo} atrasada`,
        description: 'Meta de saída já ultrapassada para transporte prioritário.',
        timeAgo: 'agora',
        entityId: transporte.id,
        sectionId: 'painel-decisao-prioritarios',
      });
    }

    if (
      transporte.tempoEstimadoFinalizarMin > transporte.tempoRestanteSaidaMin &&
      transporte.etapaAtual !== 'finalizado'
    ) {
      alertas.push({
        id: `al-atraso-${transporte.id}`,
        tipo: 'atraso_iminente',
        severity: transporte.nivelRisco === 'critico' ? 'error' : 'warning',
        title: `${transporte.codigo} prestes a atrasar`,
        description: 'O tempo previsto de processo excede o tempo restante para saída.',
        timeAgo: 'agora',
        entityId: transporte.id,
        sectionId: 'painel-criticidade',
      });
    }
  }

  const conferencia = pipeline.find((p) => p.etapa === 'conferencia');
  if (conferencia && conferencia.qtdMapas >= 10) {
    alertas.push({
      id: 'al-fila-conferencia',
      tipo: 'fila_conferencia',
      severity: 'warning',
      title: 'Fila acumulada em Conferência',
      description: `${conferencia.qtdMapas} mapas aguardando — tempo médio parado ${conferencia.tempoMedioParadoMin} min.`,
      timeAgo: 'agora',
      sectionId: 'pipeline-operacional',
    });
  }

  return alertas;
}

function parseNumeric(value: string | null | undefined): number {
  if (value == null || value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatarNumero(value: number): string {
  return value.toLocaleString('pt-BR');
}

function formatarPesoKg(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function mapStatusTransporte(
  status: string,
): TorreControleSnapshot['transportes'][number]['status'] {
  return status.toUpperCase() as TorreControleSnapshot['transportes'][number]['status'];
}

function calcularPercentual(realizado: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((realizado / total) * 100));
}

function montarKpiComTotal(input: {
  id: string;
  label: string;
  realizado: number;
  total: number;
  accent: TorreControleSnapshot['kpis'][number]['accent'];
  formatar?: (value: number) => string;
  unidadeTotal?: string;
  footer?: string;
}): TorreControleSnapshot['kpis'][number] {
  const formatar = input.formatar ?? formatarNumero;

  return {
    id: input.id,
    label: input.label,
    value: formatar(input.realizado),
    suffix: `/ ${formatar(input.total)} ${input.unidadeTotal ?? 'total'}`,
    footer: input.footer,
    progress: calcularPercentual(input.realizado, input.total),
    accent: input.accent,
  };
}

function montarKpis(
  readModel: TorreControleReadModel,
  transportesOperacionais: TorreControleSnapshot['transportes'],
): TorreControleSnapshot['kpis'] {
  const turno = readModel.turno;
  const transportes = readModel.transportes;
  const totalMapas =
    (turno?.mapasPendentes ?? 0) + (turno?.mapasFinalizados ?? 0);
  const pesoTotalKg = parseNumeric(turno?.pesoTotalKg);
  const pesoFinalizadoKg = parseNumeric(turno?.pesoFinalizadoKg);

  const totalPrioridades = transportes.filter((t) => t.prioridade).length;
  const prioridadesPendentes = transportes.filter(
    (t) => t.prioridade && t.etapaAtual !== 'finalizado',
  ).length;

  const emRisco = transportesOperacionais.filter(
    (t) => t.nivelRisco === 'critico' || t.nivelRisco === 'alto',
  ).length;
  const criticos = transportesOperacionais.filter(
    (t) => t.nivelRisco === 'critico',
  ).length;

  const finalizadosPct = calcularPercentual(
    turno?.transportesFinalizados ?? 0,
    turno?.totalTransportes ?? 0,
  );

  return [
    montarKpiComTotal({
      id: 'volume-noite',
      label: 'Volume da Noite',
      realizado: pesoFinalizadoKg,
      total: pesoTotalKg,
      formatar: formatarPesoKg,
      unidadeTotal: 'kg total',
      accent: 'primary',
    }),
    montarKpiComTotal({
      id: 'transportes',
      label: 'Transportes',
      realizado: turno?.transportesFinalizados ?? 0,
      total: turno?.totalTransportes ?? 0,
      accent: 'muted',
    }),
    montarKpiComTotal({
      id: 'prioridades-pendentes',
      label: 'Prioridades Pendentes',
      realizado: prioridadesPendentes,
      total: totalPrioridades,
      accent: prioridadesPendentes > 0 ? 'destructive' : 'muted',
    }),
    montarKpiComTotal({
      id: 'mapas-andamento',
      label: 'Mapas em Andamento',
      realizado: turno?.mapasPendentes ?? 0,
      total: totalMapas,
      accent: 'primary',
    }),
    montarKpiComTotal({
      id: 'mapas-finalizados',
      label: 'Mapas Finalizados',
      realizado: turno?.mapasFinalizados ?? 0,
      total: totalMapas,
      accent: 'muted',
    }),
    montarKpiComTotal({
      id: 'transportes-risco',
      label: 'Transportes em Risco',
      realizado: emRisco,
      total: turno?.totalTransportes ?? 0,
      footer: criticos > 0 ? `${criticos} críticos` : undefined,
      accent: emRisco > 0 ? 'destructive' : 'muted',
    }),
    {
      id: 'produtividade',
      label: 'Produtividade Geral',
      value: '—',
      suffix: '/ — total',
      accent: 'warning',
    },
    {
      id: 'sla',
      label: 'SLA da Operação',
      value: String(finalizadosPct),
      suffix: `/ 100% meta · ${turno?.transportesFinalizados ?? 0}/${turno?.totalTransportes ?? 0} transp.`,
      progress: finalizadosPct,
      accent: finalizadosPct < 90 ? 'destructive' : 'primary',
    },
  ];
}

export function montarSnapshotTorreControle(
  readModel: TorreControleReadModel,
  sessaoId?: string,
): TorreControleSnapshot {
  const turnoRow = readModel.turno;
  const turnoInicio = turnoRow?.turnoInicioEm ?? new Date();
  const turnoFim = turnoRow?.horarioExpectativaSaida ?? new Date();

  const horariosPorTransporte = resolverHorariosProcessosPorTransporte(
    readModel.mapasHorarios,
  );

  const transportesEnriquecidos = readModel.transportes.map((t) => {
      const tempoEstimadoFinalizarSeg =
        t.etapaAtual === 'finalizado'
          ? 0
          : estimarTempoFinalizarTransporteSeg(
              t.transporteId,
              readModel.mapasPendentes,
            );

      const tempoEstimadoFinalizarMin =
        t.etapaAtual === 'finalizado'
          ? 0
          : Math.ceil(tempoEstimadoFinalizarSeg / 60);

      const mapasPendentesTransporte = readModel.mapasPendentes.filter(
        (m) => m.transporteId === t.transporteId,
      );
      const resumoMapas = calcularResumoMapasTransporte(
        readModel.mapasOperacionais,
        t.transporteId,
      );

      return enriquecerTransporteOperacional({
        id: t.transporteId,
        codigo: t.codigo,
        placa: t.placa,
        transportadora: t.transportadora,
        prioridade: t.prioridade,
        isPrioridade: t.isPrioridade,
        nivelPrioridade: t.nivelPrioridade,
        reentregaExclusiva: t.reentregaExclusiva,
        status: mapStatusTransporte(t.statusAlocacao),
        etapaAtual: t.etapaAtual as EtapaOperacional,
        horarioSaida: formatarMetaLargada(t.horarioExpectativaSaida),
        tempoRestanteSaidaMin: t.tempoRestanteSaidaMin,
        tempoRestanteSaidaSeg: t.tempoRestanteSaidaSeg,
        tempoEstimadoFinalizarMin,
        tempoEstimadoFinalizarSeg,
        mapasTotal: resumoMapas.mapasTotal,
        mapasConcluidos: resumoMapas.mapasConcluidos,
        volumePaletes: readModel.paletesPorTransporte.get(t.transporteId) ?? 0,
        pesoTotalKg: t.pesoTotalKg,
        statusProcessos: resolverStatusProcessos(
          t.etapaAtual as EtapaOperacional,
          mapasPendentesTransporte,
        ),
        horariosProcessos: horariosPorTransporte.get(t.transporteId) ?? {
          separacao: { inicio: null, fim: null },
          conferencia: { inicio: null, fim: null },
          carregamento: { inicio: null, fim: null },
        },
        viagemId: t.viagemId,
        viagemInicioEm: t.viagemInicioEm
          ? formatarDataHoraPtBr(t.viagemInicioEm)
          : null,
        viagemFimEm: t.viagemFimEm ? formatarDataHoraPtBr(t.viagemFimEm) : null,
        anomalia: t.anomalia,
        docaAlocada: t.docaCodigo ?? undefined,
        lacreCarregamento: t.lacreCarregamento ?? undefined,
      });
    });

  const transportesOperacionais = transportesEnriquecidos.filter(
    (transporte) => transporte.etapaAtual !== 'finalizado',
  );

  const transportesBase = [...transportesEnriquecidos].sort((a, b) => {
    const aFinalizado = a.etapaAtual === 'finalizado';
    const bFinalizado = b.etapaAtual === 'finalizado';

    if (aFinalizado !== bFinalizado) {
      return aFinalizado ? 1 : -1;
    }

    return b.scoreCriticidade - a.scoreCriticidade;
  });

  const pipeline = montarPipeline(
    readModel,
    turnoRow?.mapasFinalizados ?? 0,
  );

  const alertas = montarAlertas(
    transportesOperacionais,
    pipeline,
    readModel.mapasOperacionais,
  );

  const mapas = readModel.mapasOperacionais.map((m) => ({
    id: m.mapaGrupoId,
    codigo: m.titulo,
    transporteId: m.transporteId,
    transporteCodigo: m.transporteCodigo,
    etapa: m.processo as EtapaOperacional,
    status: resolverStatusMapa(m),
    horarioInicio: m.iniciadoEm ? formatarDataHoraPtBr(m.iniciadoEm) : null,
    horarioFim: m.finalizadoEm ? formatarDataHoraPtBr(m.finalizadoEm) : null,
    tempoParadoMin: Math.ceil(m.tempoParadoSeg / 60),
    tempoParadoSeg: m.tempoParadoSeg,
    operador: m.operadorNome ?? undefined,
    prioridade: m.prioridade,
  }));

  return {
    kpis: montarKpis(readModel, transportesOperacionais),
    pipeline,
    recursos: montarRecursos(readModel),
    timeline: montarTimeline(readModel, turnoInicio),
    docas: [],
    transportes: transportesBase,
    mapas,
    alertas,
    turno: {
      sessaoId: sessaoId ?? turnoRow?.uploadLoteId.slice(0, 8) ?? '—',
      turnoLabel: 'Turno Expedição',
      inicio: formatarHora(turnoInicio),
      fim: formatarHora(turnoFim),
      progressoPercent: calcularProgressoTurno(turnoInicio, turnoFim),
      previsaoConclusao: formatarHora(turnoFim),
      transportesEmRisco: transportesBase.filter(
        (t) => t.nivelRisco === 'critico' || t.nivelRisco === 'alto',
      ).length,
      latencyMs: 0,
    },
  };
}
