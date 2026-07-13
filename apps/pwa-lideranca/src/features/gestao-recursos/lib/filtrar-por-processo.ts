import type {
  DemandaSeparacaoApi,
  MapaGrupoProcessoApi,
  RecursosSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

export function filtrarResponsePorProcesso(
  response: RecursosSessaoApiResponse,
  processo: MapaGrupoProcessoApi,
): RecursosSessaoApiResponse {
  const demandas = response.demandas.filter(
    (demanda) => demanda.mapaGrupoProcesso === processo,
  );

  return {
    ...response,
    demandas,
  };
}

export function filtrarOperadoresPorProcesso(
  operators: Operator[],
  processo: MapaGrupoProcessoApi,
): Operator[] {
  return operators.map((operator) => {
    const tasks =
      operator.tasks?.filter((task) => task.processo === processo) ?? [];

    if (tasks.length === 0) {
      if (operator.status === 'atuando') {
        return {
          ...operator,
          status: 'ocioso' as const,
          currentMission: undefined,
          startTime: undefined,
          progress: undefined,
          expectedEnd: undefined,
          isLate: undefined,
          tasks: undefined,
        };
      }

      return operator;
    }

    const activeTask =
      tasks.find((task) => task.status === 'em_andamento') ?? tasks[0];
    const lastTask = tasks[tasks.length - 1];

    return {
      ...operator,
      status: 'atuando' as const,
      currentMission: activeTask?.label,
      startTime: activeTask?.startTime,
      progress: activeTask?.progress,
      expectedEnd: lastTask?.expectedEndTime,
      isLate: lastTask?.isLate,
      tasks,
    };
  });
}

export function marcarEquipeCarregamentoComoAtuando(
  operators: Operator[],
  demandas: DemandaSeparacaoApi[],
): Operator[] {
  const demandasAtivas = demandas.filter(
    (demanda) =>
      demanda.status === 'pendente' || demanda.status === 'em_andamento',
  );

  const alocacaoPorOperador = new Map<string, DemandaSeparacaoApi>();

  for (const demanda of demandasAtivas) {
    alocacaoPorOperador.set(demanda.sessaoFuncionarioId, demanda);

    for (const membro of demanda.funcionarios ?? []) {
      if (membro.papel === 'auxiliar') {
        alocacaoPorOperador.set(membro.sessaoFuncionarioId, demanda);
      }
    }
  }

  return operators.map((operator) => {
    const demanda = alocacaoPorOperador.get(operator.id);
    if (!demanda) {
      return operator;
    }

    const tasksCarregamento =
      operator.tasks?.filter((task) => task.processo === 'carregamento') ?? [];

    if (operator.status === 'atuando' && tasksCarregamento.length > 0) {
      return {
        ...operator,
        status: 'atuando' as const,
        currentMission: tasksCarregamento[0]?.label ?? demanda.mapaGrupoTitulo,
        tasks: tasksCarregamento,
      };
    }

    return {
      ...operator,
      status: 'atuando' as const,
      currentMission: demanda.mapaGrupoTitulo,
      tasks: [
        {
          id: demanda.id,
          mapaGrupoId: demanda.mapaGrupoId,
          processo: 'carregamento',
          label: demanda.mapaGrupoTitulo,
          status: 'em_andamento',
        },
      ],
    };
  });
}
