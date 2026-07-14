import {
  buildPauseFields,
  enrichProximaPausa,
  withProximaPausa,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import { withApoioFields } from '@/features/gestao-recursos/lib/apoio-fields';
import {
  formatDurationMinutes,
  formatElapsedSinceStart,
  formatTimeFromIso,
  getElapsedMinutes,
} from '@/features/gestao-recursos/lib/pausa-utils';
import type { RecursosSessaoFuncionarioApi, SessaoPausaTipoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  Operator,
  TaskItem,
} from '@/features/gestao-recursos/types/gestao-recursos.schema';

import type { DemandaRecebimentoRecursoApi, RecebimentoAlocacaoStatusApi } from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';
import { getReferenciaOciosidadeRecebimentoIso } from '@/features/gestao-recursos-recebimento/lib/recebimento-ociosidade';

const IDLE_THRESHOLD_BASE = 30;

function getDemandaIdentificador(demanda: DemandaRecebimentoRecursoApi): string {
  return demanda.placa ?? demanda.transportadoraNome ?? 'Recebimento';
}

function formatDemandaMission(demanda: DemandaRecebimentoRecursoApi): string {
  const identificador = getDemandaIdentificador(demanda);

  if (demanda.statusDemanda === 'em_conferencia') {
    return `Em conferência · ${identificador}`;
  }

  return `Aguardando início · ${identificador}`;
}

function isApoioAtivo(status: RecebimentoAlocacaoStatusApi): boolean {
  return status === 'atribuida' || status === 'iniciada';
}

function getDemandasAtivasDoOperador(
  demandas: DemandaRecebimentoRecursoApi[],
  sessaoFuncionarioId: string,
  funcionarioId: number,
): DemandaRecebimentoRecursoApi[] {
  return demandas.filter((demanda) => {
    if (demanda.statusDemanda === 'disponivel') {
      return false;
    }

    if (demanda.alocacao?.sessaoFuncionarioId === sessaoFuncionarioId) {
      return true;
    }

    if (
      demanda.apoios.some(
        (apoio) =>
          apoio.funcionarioId === funcionarioId && isApoioAtivo(apoio.status),
      )
    ) {
      return true;
    }

    return (
      demanda.statusDemanda === 'em_conferencia' &&
      demanda.conferente?.id === funcionarioId
    );
  });
}

function pickDemandaPrincipal(
  demandas: DemandaRecebimentoRecursoApi[],
): DemandaRecebimentoRecursoApi | undefined {
  return (
    demandas.find((demanda) => demanda.statusDemanda === 'em_conferencia') ??
    demandas.find((demanda) => demanda.statusDemanda === 'atribuida') ??
    demandas[0]
  );
}

function getDemandaStartIsoForOperador(
  demanda: DemandaRecebimentoRecursoApi,
  funcionarioId: number,
): string | undefined {
  const apoio = demanda.apoios.find(
    (item) =>
      item.funcionarioId === funcionarioId && isApoioAtivo(item.status),
  );

  if (apoio) {
    return apoio.atribuidoEm;
  }

  return demanda.recebimentoDataInicio ?? demanda.alocacao?.atribuidoEm ?? undefined;
}

function buildTasksFromDemandas(
  demandas: DemandaRecebimentoRecursoApi[],
  funcionarioId: number,
  now: Date,
): TaskItem[] {
  return demandas.map((demanda) => {
    const startIso = getDemandaStartIsoForOperador(demanda, funcionarioId);

    return {
      id: demanda.preRecebimentoId,
      label: formatDemandaMission(demanda),
      startTime: startIso ? formatTimeFromIso(startIso) : undefined,
      startElapsed: startIso
        ? formatElapsedSinceStart(startIso, now)
        : undefined,
      status:
        demanda.statusDemanda === 'em_conferencia'
          ? ('em_andamento' as const)
          : ('pendente' as const),
    };
  });
}

function buildOperadorAtuandoRecebimento(
  operatorId: string,
  name: string,
  sector: string,
  demandasAtivas: DemandaRecebimentoRecursoApi[],
  funcionarioId: number,
  now: Date,
): Operator {
  const principal = pickDemandaPrincipal(demandasAtivas);
  const tasks = buildTasksFromDemandas(demandasAtivas, funcionarioId, now);
  const startIso = principal
    ? getDemandaStartIsoForOperador(principal, funcionarioId)
    : undefined;

  return {
    id: operatorId,
    name,
    sector,
    status: 'atuando',
    currentMission: principal ? formatDemandaMission(principal) : undefined,
    startTime: startIso ? formatTimeFromIso(startIso) : undefined,
    startElapsed: startIso
      ? formatElapsedSinceStart(startIso, now)
      : undefined,
    tasks: tasks.length > 0 ? tasks : undefined,
  };
}

function buildOperadorOciosoRecebimento(
  operatorId: string,
  name: string,
  sector: string,
  checkIn: string | null,
  ultimaMissaoFinalizadaEm: string | null | undefined,
  now: Date,
): Operator {
  const referenciaOciosidade = getReferenciaOciosidadeRecebimentoIso(
    checkIn,
    ultimaMissaoFinalizadaEm,
  );
  const idleElapsed = referenciaOciosidade
    ? getElapsedMinutes(referenciaOciosidade, now)
    : 0;
  const idleThreshold = Math.min(
    100,
    Math.round((idleElapsed / 60) * IDLE_THRESHOLD_BASE),
  );

  return {
    id: operatorId,
    name,
    sector,
    status: 'ocioso',
    idleDuration: `${formatDurationMinutes(idleElapsed).toUpperCase()} DISPONÍVEL`,
    idleThreshold: idleThreshold || 5,
  };
}

function buildOperadorEmPausaRecebimento(
  operatorId: string,
  name: string,
  sector: string,
  pausaInicio: string,
  pausaTipo: SessaoPausaTipoApi,
  demandasAtivas: DemandaRecebimentoRecursoApi[],
  funcionarioId: number,
  now: Date,
): Operator {
  const pauseFields = buildPauseFields(pausaInicio, pausaTipo, now);

  if (demandasAtivas.length === 0) {
    return {
      id: operatorId,
      name,
      sector,
      status: 'pausa',
      ...pauseFields,
    };
  }

  const base = buildOperadorAtuandoRecebimento(
    operatorId,
    name,
    sector,
    demandasAtivas,
    funcionarioId,
    now,
  );

  return {
    ...base,
    status: 'atuando',
    ...pauseFields,
  };
}

export function mapRecursosRecebimentoToOperators(
  funcionarios: RecursosSessaoFuncionarioApi[],
  demandas: DemandaRecebimentoRecursoApi[],
  now = new Date(),
): Operator[] {
  return funcionarios.map((funcionario) => {
    const operatorId = funcionario.id;
    const sector = funcionario.cargo || 'Recebimento';
    const proxima = enrichProximaPausa(funcionario.proximaPausa, now);
    const demandasAtivas = getDemandasAtivasDoOperador(
      demandas,
      funcionario.id,
      funcionario.funcionarioId,
    );

    if (funcionario.pausaAtiva) {
      return withApoioFields(
        withProximaPausa(
          buildOperadorEmPausaRecebimento(
            operatorId,
            funcionario.nome,
            sector,
            funcionario.pausaAtiva.inicio,
            funcionario.pausaAtiva.tipo,
            demandasAtivas,
            funcionario.funcionarioId,
            now,
          ),
          proxima,
        ),
        funcionario,
      );
    }

    if (demandasAtivas.length > 0) {
      return withApoioFields(
        withProximaPausa(
          buildOperadorAtuandoRecebimento(
            operatorId,
            funcionario.nome,
            sector,
            demandasAtivas,
            funcionario.funcionarioId,
            now,
          ),
          proxima,
        ),
        funcionario,
      );
    }

    return withApoioFields(
      withProximaPausa(
        buildOperadorOciosoRecebimento(
          operatorId,
          funcionario.nome,
          sector,
          funcionario.checkIn,
          funcionario.ultimaMissaoFinalizadaEm,
          now,
        ),
        proxima,
      ),
      funcionario,
    );
  });
}
