import {
  listSessaoFuncionarioPausas,
  listSessaoFuncionarios,
  listSessoes,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import type {
  ListSessaoFuncionarioPausasApiResponse,
  SessaoFuncionarioPausaApi,
} from '@/features/pausas/types/pausas.api';
import { isFuncionarioElegivelPausa } from '@/features/pausas/lib/pausas-mappers';

export type FuncionarioPausasData = {
  funcionario: SessaoFuncionarioApi;
  pausas: ListSessaoFuncionarioPausasApiResponse;
};

export function todayReference(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchSessoesDoDia(
  unidadeId: string,
  statuses: Array<SessaoApi['status']>,
): Promise<SessaoApi[]> {
  const dataRef = todayReference();
  const results = await Promise.all(
    statuses.map((status) =>
      listSessoes({ unidadeId, dataReferencia: dataRef, status, limit: 20 }),
    ),
  );

  const byId = new Map<string, SessaoApi>();
  for (const response of results) {
    for (const sessao of response.items) {
      byId.set(sessao.id, sessao);
    }
  }

  return [...byId.values()];
}

export async function fetchFuncionariosElegiveis(
  sessaoId: string,
): Promise<SessaoFuncionarioApi[]> {
  const response = await listSessaoFuncionarios(sessaoId);
  return response.items.filter((f) => isFuncionarioElegivelPausa(f.status));
}

export async function fetchPausasPorFuncionarios(
  sessaoId: string,
  funcionarios: SessaoFuncionarioApi[],
): Promise<FuncionarioPausasData[]> {
  return Promise.all(
    funcionarios.map(async (funcionario) => {
      const pausas = await listSessaoFuncionarioPausas(
        sessaoId,
        funcionario.funcionarioId,
      );
      return { funcionario, pausas };
    }),
  );
}

export async function fetchPausasSessao(
  sessaoId: string,
): Promise<FuncionarioPausasData[]> {
  const funcionarios = await fetchFuncionariosElegiveis(sessaoId);
  return fetchPausasPorFuncionarios(sessaoId, funcionarios);
}

export async function fetchPausasSessoes(
  sessoes: SessaoApi[],
): Promise<
  Array<{
    sessao: SessaoApi;
    dados: FuncionarioPausasData[];
  }>
> {
  return Promise.all(
    sessoes.map(async (sessao) => ({
      sessao,
      dados: await fetchPausasSessao(sessao.id),
    })),
  );
}

export function collectPausasFinalizadas(
  dados: FuncionarioPausasData[],
): Array<{
  funcionario: SessaoFuncionarioApi;
  pausa: SessaoFuncionarioPausaApi;
}> {
  const result: Array<{
    funcionario: SessaoFuncionarioApi;
    pausa: SessaoFuncionarioPausaApi;
  }> = [];

  for (const { funcionario, pausas } of dados) {
    for (const pausa of pausas.items) {
      if (pausa.fim != null) {
        result.push({ funcionario, pausa });
      }
    }
  }

  return result;
}

export function sumTotalPausadoMinutos(dados: FuncionarioPausasData[]): number {
  return dados.reduce((acc, { pausas }) => acc + pausas.totalPausasMinutos, 0);
}
