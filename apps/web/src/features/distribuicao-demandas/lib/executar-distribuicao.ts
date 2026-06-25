import { criarDemandas } from '@/features/gestao-recursos/lib/gestao-recursos-api';
import type { MapaGrupoProcessoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { operadorElegivelPresenca } from '@/features/distribuicao-demandas/lib/mapear-funcao-operador';
import type {
  MapaGrupoProcesso,
  MapaIndex,
  Operador,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type FalhaExecucaoDistribuicao = {
  operadorNome: string;
  sessaoFuncionarioId: string;
  processo: MapaGrupoProcesso;
  mensagem: string;
  mapaGrupoIds: string[];
};

export type ResultadoExecucaoDistribuicao = {
  criadas: number;
  falhas: FalhaExecucaoDistribuicao[];
  avisos: string[];
};

export type ExecutarDistribuicaoInput = {
  sessaoId: string;
  workloads: Workload[];
  mapaIndex: MapaIndex;
  operadores: Operador[];
  operadoresCarregamento: Operador[];
  transporteIdsAlocados: string[];
  permitirParcial?: boolean;
};

function coletarMapasDosTransportes(
  transporteIds: string[],
  mapaIndex: MapaIndex,
  processo: MapaGrupoProcesso,
): string[] {
  const ids: string[] = [];
  for (const transporteId of transporteIds) {
    const entry = mapaIndex[transporteId];
    if (!entry) continue;
    ids.push(...entry[processo]);
  }
  return [...new Set(ids)];
}

function distribuirRoundRobin(
  mapaGrupoIds: string[],
  operadorIds: string[],
): Array<{ sessaoFuncionarioId: string; mapaGrupoIds: string[] }> {
  if (operadorIds.length === 0 || mapaGrupoIds.length === 0) return [];

  const lotes = new Map<string, string[]>();
  for (const id of operadorIds) {
    lotes.set(id, []);
  }

  mapaGrupoIds.forEach((mapaId, index) => {
    const operadorId = operadorIds[index % operadorIds.length]!;
    lotes.get(operadorId)!.push(mapaId);
  });

  return [...lotes.entries()]
    .filter(([, ids]) => ids.length > 0)
    .map(([sessaoFuncionarioId, ids]) => ({ sessaoFuncionarioId, mapaGrupoIds: ids }));
}

function resolverOperador(
  operadores: Operador[],
  operadorId: string,
): Operador | undefined {
  return operadores.find((o) => o.id === operadorId);
}

function validarPreExecucao(input: ExecutarDistribuicaoInput): string[] {
  const erros: string[] = [];
  const avisos: string[] = [];

  const workloadsAtivos = input.workloads.filter((w) => w.transporteIds.length > 0);

  if (workloadsAtivos.length === 0) {
    erros.push('Nenhum transporte foi alocado nos workloads.');
  }

  for (const workload of workloadsAtivos) {
    if (workload.separadorIds.length === 0) {
      erros.push(`Workload ${workload.indice + 1} não possui separador.`);
    }
    if (workload.conferenteIds.length === 0) {
      erros.push(`Workload ${workload.indice + 1} não possui conferente.`);
    }

    for (const transporteId of workload.transporteIds) {
      const entry = input.mapaIndex[transporteId];
      if (!entry) {
        erros.push(`Transporte ${transporteId} não encontrado no índice de mapas.`);
        continue;
      }
      if (entry.separacao.length === 0) {
        erros.push(`Transporte ${transporteId} não possui mapas de separação disponíveis.`);
      }
      if (entry.conferencia.length === 0 && !input.permitirParcial) {
        avisos.push(`Transporte ${transporteId} sem mapas de conferência disponíveis.`);
      }
      if (entry.carregamento.length === 0 && !input.permitirParcial) {
        avisos.push(`Transporte ${transporteId} sem mapas de carregamento disponíveis.`);
      }
    }
  }

  const todosOperadores = [
    ...input.operadores,
    ...input.operadoresCarregamento,
  ];

  for (const workload of workloadsAtivos) {
    for (const opId of [...workload.separadorIds, ...workload.conferenteIds]) {
      const op = resolverOperador(todosOperadores, opId);
      if (!op) {
        erros.push(`Operador ${opId} não encontrado.`);
        continue;
      }
      if (!operadorElegivelPresenca(op.statusPresenca)) {
        erros.push(`${op.nome} não está presente na sessão.`);
      }
    }
  }

  if (avisos.length > 0 && !input.permitirParcial) {
    erros.push(
      `${avisos.length} transporte(s) com mapas incompletos. Confirme a execução parcial ou aguarde a geração dos mapas.`,
    );
  }

  return erros;
}

async function executarLote(
  sessaoId: string,
  sessaoFuncionarioId: string,
  mapaGrupoIds: string[],
  processo: MapaGrupoProcessoApi,
  operadorNome: string,
): Promise<{ criadas: number; falha?: FalhaExecucaoDistribuicao }> {
  try {
    const response = await criarDemandas({
      sessaoId,
      sessaoFuncionarioId,
      mapaGrupoIds,
    });
    return { criadas: response.demandas.length };
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : 'Erro ao criar demandas';
    return {
      criadas: 0,
      falha: {
        operadorNome,
        sessaoFuncionarioId,
        processo,
        mensagem,
        mapaGrupoIds,
      },
    };
  }
}

export async function executarDistribuicao(
  input: ExecutarDistribuicaoInput,
): Promise<ResultadoExecucaoDistribuicao> {
  const erros = validarPreExecucao(input);
  if (erros.length > 0) {
    throw new Error(erros.join(' '));
  }

  const avisos: string[] = [];
  const falhas: FalhaExecucaoDistribuicao[] = [];
  let criadas = 0;

  const todosOperadores = [
    ...input.operadores,
    ...input.operadoresCarregamento,
  ];

  const workloadsAtivos = input.workloads.filter((w) => w.transporteIds.length > 0);

  for (const workload of workloadsAtivos) {
    const processos: Array<{
      processo: MapaGrupoProcesso;
      operadorIds: string[];
      liderId?: string;
    }> = [
      { processo: 'separacao', operadorIds: workload.separadorIds },
      { processo: 'conferencia', operadorIds: workload.conferenteIds },
      {
        processo: 'carregamento',
        operadorIds: workload.separadorIds.length > 0
          ? [workload.separadorIds[0]!]
          : input.operadoresCarregamento.length > 0
            ? [input.operadoresCarregamento[0]!.id]
            : input.operadores.filter((o) => o.funcao === 'separador').map((o) => o.id).slice(0, 1),
      },
    ];

    for (const { processo, operadorIds } of processos) {
      const mapaGrupoIds = coletarMapasDosTransportes(
        workload.transporteIds,
        input.mapaIndex,
        processo,
      );

      if (mapaGrupoIds.length === 0) {
        avisos.push(
          `Workload ${workload.indice + 1}: nenhum mapa de ${processo} para os transportes alocados.`,
        );
        continue;
      }

      if (processo === 'carregamento') {
        const liderId = operadorIds[0];
        if (!liderId) {
          falhas.push({
            operadorNome: '—',
            sessaoFuncionarioId: '—',
            processo,
            mensagem: 'Nenhum operador disponível para carregamento.',
            mapaGrupoIds,
          });
          continue;
        }

        const op = resolverOperador(todosOperadores, liderId);
        const result = await executarLote(
          input.sessaoId,
          liderId,
          mapaGrupoIds,
          processo,
          op?.nome ?? liderId,
        );
        criadas += result.criadas;
        if (result.falha) falhas.push(result.falha);
        continue;
      }

      const lotes = distribuirRoundRobin(mapaGrupoIds, operadorIds);

      for (const lote of lotes) {
        const op = resolverOperador(todosOperadores, lote.sessaoFuncionarioId);
        const result = await executarLote(
          input.sessaoId,
          lote.sessaoFuncionarioId,
          lote.mapaGrupoIds,
          processo,
          op?.nome ?? lote.sessaoFuncionarioId,
        );
        criadas += result.criadas;
        if (result.falha) falhas.push(result.falha);
      }
    }
  }

  return { criadas, falhas, avisos };
}
