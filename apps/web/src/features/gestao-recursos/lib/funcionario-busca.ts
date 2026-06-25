import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

type FuncionarioBuscaRef = Pick<
  SessaoFuncionarioApi,
  'nome' | 'matricula' | 'funcionarioId'
>;

export function funcionarioMatchesBusca(
  funcionario: FuncionarioBuscaRef | null | undefined,
  termo: string,
): boolean {
  const busca = termo.trim().toLowerCase();

  if (!funcionario || !busca) {
    return false;
  }

  return (
    funcionario.nome.toLowerCase().includes(busca) ||
    funcionario.matricula.toLowerCase().includes(busca) ||
    String(funcionario.funcionarioId).includes(busca)
  );
}

export function buildFuncionarioPorSessaoIdMap(
  funcionarios: SessaoFuncionarioApi[],
): Map<string, SessaoFuncionarioApi> {
  return new Map(funcionarios.map((funcionario) => [funcionario.id, funcionario]));
}
