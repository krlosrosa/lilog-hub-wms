import type { RecebimentoPainelSnapshotDto } from '../../dtos/recebimento/recebimento-painel-snapshot.dto.js';
import type { PreRecebimentoSituacao } from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  RecebimentoPainelReadModel,
  RecebimentoPainelPreRecebimentoRow,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import {
  extrairNumeroDocaPainel,
} from '../../../infra/db/recebimento/get-recebimento-painel-snapshot.drizzle.js';
import {
  mapSubtipoToCategoria,
  montarAnomaliasRecebimentoPainel,
  resolverCategoriaLabel,
} from './montar-anomalias-recebimento-painel.js';
import {
  montarSessaoOperacionalPainel,
  mapOperadorPainel,
  type SessaoOperacionalPainelInput,
} from './montar-sessao-operacional-painel.js';

export type { SessaoOperacionalPainelInput };

const PIPELINE_SITUACOES: PreRecebimentoSituacao[] = [
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'impedido',
  'conferido',
  'finalizado',
  'cancelado',
];

const STATUS_LABELS: Record<PreRecebimentoSituacao, string> = {
  agendado: 'Agendado',
  aguardando: 'Aguardando',
  liberado_para_conferencia: 'Liberado p/ conferência',
  em_conferencia: 'Em conferência',
  impedido: 'Impedido',
  conferido: 'Conferido',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const FILA_ATIVA: PreRecebimentoSituacao[] = [
  'liberado_para_conferencia',
  'em_conferencia',
  'impedido',
  'aguardando',
];

const PRIORIDADE_ORDEM: Record<string, number> = {
  urgente: 0,
  alto: 1,
  normal: 2,
  baixo: 3,
};


function formatarDataReferencia(dataInicio: Date, dataFim: Date): string {
  const inicio = dataInicio.toLocaleDateString('pt-BR');
  const fim = dataFim.toLocaleDateString('pt-BR');
  return inicio === fim ? inicio : `${inicio} — ${fim}`;
}

function resolverTurnoLabel(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Turno Manhã';
  if (hour < 18) return 'Turno Tarde';
  return 'Turno Noite';
}

function isAtrasado(row: RecebimentoPainelPreRecebimentoRow, now: Date): boolean {
  if (
    row.situacao !== 'agendado' &&
    row.situacao !== 'aguardando' &&
    row.situacao !== 'liberado_para_conferencia'
  ) {
    return false;
  }

  return row.horarioPrevisto.getTime() < now.getTime();
}

function formatarTempoOcupacao(inicio: Date, now: Date): string {
  const diffMs = Math.max(0, now.getTime() - inicio.getTime());
  const totalMin = Math.floor(diffMs / 60_000);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${String(minutos).padStart(2, '0')}m`;
}

function formatarHora(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatarPesoKg(pesoKg: number): string {
  return pesoKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function calcularVolumesKgPainel(
  empresaRecebimentos: RecebimentoPainelReadModel['empresaRecebimentos'],
): { recebidoKg: number; esperadoKg: number } {
  const porPre = new Map<
    string,
    { pesoKg: number; situacao: PreRecebimentoSituacao }
  >();

  for (const row of empresaRecebimentos) {
    const atual = porPre.get(row.preRecebimentoId);
    if (!atual) {
      porPre.set(row.preRecebimentoId, {
        pesoKg: row.pesoKg,
        situacao: row.situacao,
      });
      continue;
    }

    atual.pesoKg += row.pesoKg;
  }

  let recebidoKg = 0;
  let esperadoKg = 0;

  for (const { pesoKg, situacao } of porPre.values()) {
    esperadoKg += pesoKg;
    if (situacao === 'finalizado') {
      recebidoKg += pesoKg;
    }
  }

  return {
    recebidoKg: Math.round(recebidoKg * 1000) / 1000,
    esperadoKg: Math.round(esperadoKg * 1000) / 1000,
  };
}

function montarRecebimentosPorHora(
  readModel: RecebimentoPainelReadModel,
): RecebimentoPainelSnapshotDto['recebimentosPorHora'] {
  const porHora = new Map<number, { finalizados: number; volumeUn: number }>();

  for (const row of readModel.finalizadosPorHora) {
    porHora.set(row.hora, {
      finalizados: row.finalizados,
      volumeUn: row.volumeUn,
    });
  }

  return Array.from({ length: 24 }, (_, hora) => {
    const ponto = porHora.get(hora);
    return {
      hora: `${String(hora).padStart(2, '0')}:00`,
      finalizados: ponto?.finalizados ?? 0,
      volumeUn: ponto?.volumeUn ?? 0,
    };
  });
}

function montarRankingPorEmpresa(
  empresaRecebimentos: RecebimentoPainelReadModel['empresaRecebimentos'],
): RecebimentoPainelSnapshotDto['rankingPorEmpresa'] {
  const map = new Map<
    string,
    { qtdCarros: Set<string>; volumePeso: number; finalizados: Set<string> }
  >();

  for (const item of empresaRecebimentos) {
    const current = map.get(item.empresa) ?? {
      qtdCarros: new Set<string>(),
      volumePeso: 0,
      finalizados: new Set<string>(),
    };

    current.qtdCarros.add(item.preRecebimentoId);
    current.volumePeso += item.pesoKg;

    if (item.situacao === 'finalizado') {
      current.finalizados.add(item.preRecebimentoId);
    }

    map.set(item.empresa, current);
  }

  const rows = [...map.entries()]
    .map(([empresa, stats]) => ({
      empresa,
      qtdCarros: stats.qtdCarros.size,
      volumePeso: Math.round(stats.volumePeso * 1000) / 1000,
      finalizados: stats.finalizados.size,
      percentualPeso: 0,
    }))
    .sort((a, b) => b.volumePeso - a.volumePeso);

  const pesoTotal = rows.reduce((sum, row) => sum + row.volumePeso, 0);

  return rows.map((row) => ({
    ...row,
    percentualPeso:
      pesoTotal > 0
        ? Math.round((row.volumePeso / pesoTotal) * 1000) / 10
        : 0,
  }));
}

function montarFila(
  preRecebimentos: RecebimentoPainelPreRecebimentoRow[],
  now: Date,
): RecebimentoPainelSnapshotDto['fila'] {
  return preRecebimentos
    .filter((item) => FILA_ATIVA.includes(item.situacao))
    .sort((a, b) => {
      const pa =
        PRIORIDADE_ORDEM[
          (a.grauPrioridade as keyof typeof PRIORIDADE_ORDEM) ?? 'normal'
        ] ?? 2;
      const pb =
        PRIORIDADE_ORDEM[
          (b.grauPrioridade as keyof typeof PRIORIDADE_ORDEM) ?? 'normal'
        ] ?? 2;

      if (pa !== pb) return pa - pb;
      return a.horarioPrevisto.getTime() - b.horarioPrevisto.getTime();
    })
    .map((item) => ({
      preRecebimentoId: item.id,
      recebimentoId: item.recebimentoId,
      placa: item.placa ?? 'Sem placa',
      transportadoraNome: item.transportadoraNome ?? '—',
      empresas: item.empresas,
      docaCodigo: item.docaCodigo,
      horarioPrevisto: item.horarioPrevisto.toISOString(),
      situacao: item.situacao,
      skuCount: item.skuCount,
      volumeUn: Math.round(item.volumeUn),
      conferenteNome: item.conferenteNome,
      isAtrasado: isAtrasado(item, now),
      grauPrioridade:
        item.grauPrioridade === 'baixo' ||
        item.grauPrioridade === 'normal' ||
        item.grauPrioridade === 'alto' ||
        item.grauPrioridade === 'urgente'
          ? item.grauPrioridade
          : undefined,
    }));
}

function montarDocas(
  readModel: RecebimentoPainelReadModel,
  now: Date,
): RecebimentoPainelSnapshotDto['docas'] {
  return readModel.docas.map((doca, index) => {
    const ocupada =
      doca.situacao === 'ocupada' ||
      (doca.placaOcupando != null && doca.ocupacaoInicio != null);
    const emManutencao = doca.situacao === 'manutencao';

    let status: 'ocupada' | 'disponivel' | 'manutencao' = 'disponivel';
    if (emManutencao) status = 'manutencao';
    else if (ocupada) status = 'ocupada';

    return {
      numero: extrairNumeroDocaPainel(doca.codigo, index + 1),
      status,
      placa: doca.placaOcupando ?? undefined,
      etiquetaManutencao: emManutencao ? 'REV' : undefined,
      capacidadeToneladas: doca.capacidadeVeiculos ?? undefined,
      tempoOcupacao:
        doca.ocupacaoInicio && ocupada
          ? formatarTempoOcupacao(doca.ocupacaoInicio, now)
          : undefined,
      isPrioritaria:
        doca.grauPrioridade === 'urgente' || doca.grauPrioridade === 'alto',
      retornoManutencao: emManutencao ? doca.observacao ?? undefined : undefined,
    };
  });
}

function montarAlertas(
  preRecebimentos: RecebimentoPainelPreRecebimentoRow[],
  readModel: RecebimentoPainelReadModel,
  now: Date,
): RecebimentoPainelSnapshotDto['alertas'] {
  const alertas: RecebimentoPainelSnapshotDto['alertas'] = [];

  for (const item of preRecebimentos) {
    if (isAtrasado(item, now)) {
      alertas.push({
        id: `atraso-${item.id}`,
        severidade: 'error',
        mensagem: `${item.placa ?? 'Veículo'} atrasado — previsto ${formatarHora(item.horarioPrevisto)}`,
        placa: item.placa ?? undefined,
      });
    }

    if (
      item.situacao === 'aguardando' &&
      item.horarioPrevisto.getTime() < now.getTime() - 30 * 60_000
    ) {
      alertas.push({
        id: `aguardando-${item.id}`,
        severidade: 'error',
        mensagem: `Veículo ${item.placa ?? '—'} aguardando doca há mais de 30 min`,
        placa: item.placa ?? undefined,
      });
    }

    if (item.situacao === 'impedido') {
      alertas.push({
        id: `impedido-${item.id}`,
        severidade: 'warning',
        mensagem: `Conferência impedida — ${item.placa ?? 'Veículo'} aguardando retomada`,
        placa: item.placa ?? undefined,
      });
    }
  }

  for (const anomalia of readModel.anomalias.slice(0, 3)) {
    const categoria = mapSubtipoToCategoria(anomalia.subtipoOcorrencia);
    if (!categoria) {
      continue;
    }

    alertas.push({
      id: `anomalia-${anomalia.id}`,
      severidade: 'warning',
      mensagem: `${resolverCategoriaLabel(categoria)} — ${anomalia.placa ?? 'Sem placa'}`,
      placa: anomalia.placa ?? undefined,
    });
  }

  for (const doca of readModel.docas.filter((d) => d.situacao === 'manutencao')) {
    alertas.push({
      id: `doca-${doca.id}`,
      severidade: 'info',
      mensagem: `Doca ${doca.codigo} em manutenção`,
    });
  }

  if (readModel.cncGeradasCount > 0) {
    alertas.push({
      id: 'cnc-geradas',
      severidade: 'info',
      mensagem: `${readModel.cncGeradasCount} CNC(s) gerada(s) no período — origem recebimento`,
    });
  }

  return alertas.slice(0, 12);
}

function montarProdutividadeEquipe(
  produtividadeOperadores: RecebimentoPainelReadModel['produtividadeOperadores'],
  sessaoOperacional: RecebimentoPainelSnapshotDto['sessaoOperacional'],
  sessaoInput: SessaoOperacionalPainelInput | null,
  now: Date,
): RecebimentoPainelSnapshotDto['produtividadeEquipe'] {
  const statusPorFuncionarioId = new Map<
    number,
    {
      statusOperacional: RecebimentoPainelSnapshotDto['produtividadeEquipe']['operadores'][number]['statusOperacional'];
      atividade: string | null;
    }
  >();

  if (sessaoInput) {
    for (const funcionario of sessaoInput.recursos.funcionarios) {
      const operador = mapOperadorPainel(
        funcionario,
        sessaoInput.recursos.demandas,
        now,
      );
      statusPorFuncionarioId.set(funcionario.funcionarioId, {
        statusOperacional: operador.statusOperacional,
        atividade: operador.atividade,
      });
    }
  }

  const operadores = produtividadeOperadores.map((row) => {
    const status = statusPorFuncionarioId.get(row.funcionarioId);

    return {
      funcionarioId: row.funcionarioId,
      nome: row.nome,
      cargo: row.cargo,
      carros: row.carros,
      tempoMedioMin: row.tempoMedioMinutos,
      volumeUn: row.volumeUn,
      statusOperacional: status?.statusOperacional ?? null,
      atividade: status?.atividade ?? null,
    };
  });

  const temposValidos = operadores
    .map((op) => op.tempoMedioMin)
    .filter((tempo): tempo is number => tempo != null && tempo > 0);

  const tempoMedioGlobalMin =
    temposValidos.length > 0
      ? Math.round(
          (temposValidos.reduce((sum, tempo) => sum + tempo, 0) /
            temposValidos.length) *
            10,
        ) / 10
      : 0;

  const mediaCarrosPorOperador =
    operadores.length > 0
      ? Math.round(
          (operadores.reduce((sum, op) => sum + op.carros, 0) /
            operadores.length) *
            10,
        ) / 10
      : 0;

  const taxaUtilizacao =
    sessaoOperacional.conferentesAtivos > 0
      ? Math.round(
          (sessaoOperacional.atuando / sessaoOperacional.conferentesAtivos) *
            1000,
        ) / 10
      : 0;

  return {
    taxaUtilizacao,
    tempoMedioGlobalMin,
    mediaCarrosPorOperador,
    operadores,
  };
}

export function montarSnapshotRecebimentoPainel(input: {
  unidadeId: string;
  dataInicio: Date;
  dataFim: Date;
  readModel: RecebimentoPainelReadModel;
  sessaoOperacional?: SessaoOperacionalPainelInput | null;
}): RecebimentoPainelSnapshotDto {
  const now = new Date();
  const { readModel, preRecebimentos } = {
    readModel: input.readModel,
    preRecebimentos: input.readModel.preRecebimentos,
  };

  const totalPrevisto = preRecebimentos.length;
  const finalizados = preRecebimentos.filter(
    (item) => item.situacao === 'finalizado',
  ).length;
  const atrasados = preRecebimentos.filter((item) =>
    isAtrasado(item, now),
  ).length;
  const { recebidoKg, esperadoKg } = calcularVolumesKgPainel(
    readModel.empresaRecebimentos,
  );
  const pctConcluido =
    totalPrevisto > 0
      ? Math.round((finalizados / totalPrevisto) * 1000) / 10
      : 0;
  const pctVolumeRecebido =
    esperadoKg > 0
      ? Math.round((recebidoKg / esperadoKg) * 1000) / 10
      : 0;

  const pipelineTotal = preRecebimentos.length;

  const sessaoOperacional = montarSessaoOperacionalPainel(
    input.sessaoOperacional ?? null,
    now,
  );

  return {
    unidadeId: input.unidadeId,
    dataReferencia: formatarDataReferencia(input.dataInicio, input.dataFim),
    turnoLabel: resolverTurnoLabel(input.dataInicio),
    geradoEm: now.toISOString(),
    totalPrevistoDia: totalPrevisto,
    kpis: [
      {
        id: 'previstos-hoje',
        label: 'Previstos',
        value: String(totalPrevisto),
        suffix: 'carros',
        accent: 'primary',
      },
      {
        id: 'progresso-dia',
        label: 'Finalizados',
        value: `${finalizados}/${totalPrevisto}`,
        suffix: 'carros',
        accent: 'tertiary',
        progress: pctConcluido,
      },
      {
        id: 'volume-esperado',
        label: 'Volume',
        value: `${formatarPesoKg(recebidoKg)}/${formatarPesoKg(esperadoKg)}`,
        suffix: 'kg',
        accent: 'tertiary',
        progress: pctVolumeRecebido,
      },
      {
        id: 'atrasados',
        label: 'Atrasados',
        value: String(atrasados),
        accent: 'destructive',
      },
      {
        id: 'divergencias',
        label: 'Divergências',
        value: String(readModel.divergenciasCount),
        accent: 'warning',
      },
      {
        id: 'cnc-geradas',
        label: "CNC's Geradas",
        value: String(readModel.cncGeradasCount),
        accent: 'warning',
      },
    ],
    pipeline: PIPELINE_SITUACOES.filter((situacao) => situacao !== 'cancelado').map(
      (situacao) => {
        const count = preRecebimentos.filter(
          (item) => item.situacao === situacao,
        ).length;

        return {
          situacao,
          label: STATUS_LABELS[situacao],
          count,
          percentual:
            pipelineTotal > 0
              ? Math.round((count / pipelineTotal) * 1000) / 10
              : 0,
        };
      },
    ),
    recebimentosPorHora: montarRecebimentosPorHora(readModel),
    rankingPorEmpresa: montarRankingPorEmpresa(readModel.empresaRecebimentos),
    docas: montarDocas(readModel, now),
    fila: montarFila(preRecebimentos, now),
    alertas: montarAlertas(preRecebimentos, readModel, now),
    anomalias: montarAnomaliasRecebimentoPainel(
      readModel.anomalias,
      readModel.centros,
    ),
    sessaoOperacional,
    produtividadeEquipe: montarProdutividadeEquipe(
      readModel.produtividadeOperadores,
      sessaoOperacional,
      input.sessaoOperacional ?? null,
      now,
    ),
  };
}
