import {
  fetchPausasPorFuncionarios,
  type FuncionarioPausasData,
} from '@/features/pausas/lib/pausas-data';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

export type RecursosSessaoData = {
  funcionariosPausas: FuncionarioPausasData[];
};

export async function fetchRecursosSessao(
  sessaoId: string,
  funcionarios: SessaoFuncionarioApi[],
): Promise<RecursosSessaoData> {
  const funcionariosPausas = await fetchPausasPorFuncionarios(
    sessaoId,
    funcionarios,
  );

  return { funcionariosPausas };
}
