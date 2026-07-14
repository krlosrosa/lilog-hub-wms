export type ApoioAtivoOperadorInput = {
  funcionarioId: number;
  status: string;
};

export type DemandaAtivaOperadorInput = {
  statusDemanda: string;
  alocacao: { sessaoFuncionarioId: string } | null;
  conferente: { id: number } | null;
  apoios?: ApoioAtivoOperadorInput[];
};

export function isApoioAtivoStatus(status: string): boolean {
  return status === 'atribuida' || status === 'iniciada';
}

export function demandaPertenceAoOperador(
  demanda: DemandaAtivaOperadorInput,
  sessaoFuncionarioId: string,
  funcionarioId: number,
): boolean {
  if (demanda.statusDemanda === 'disponivel') {
    return false;
  }

  if (demanda.alocacao?.sessaoFuncionarioId === sessaoFuncionarioId) {
    return true;
  }

  if (
    demanda.apoios?.some(
      (apoio) =>
        apoio.funcionarioId === funcionarioId &&
        isApoioAtivoStatus(apoio.status),
    )
  ) {
    return true;
  }

  return (
    demanda.statusDemanda === 'em_conferencia' &&
    demanda.conferente?.id === funcionarioId
  );
}

export function getDemandasAtivasDoOperador<T extends DemandaAtivaOperadorInput>(
  demandas: T[],
  sessaoFuncionarioId: string,
  funcionarioId: number,
): T[] {
  return demandas.filter((demanda) =>
    demandaPertenceAoOperador(demanda, sessaoFuncionarioId, funcionarioId),
  );
}

export function buildSessaoFuncionariosComDemanda(
  demandas: DemandaAtivaOperadorInput[],
  funcionarios: Array<{ id: string; funcionarioId: number }>,
): Set<string> {
  const sessaoFuncionariosComDemanda = new Set<string>();

  for (const demanda of demandas) {
    if (demanda.statusDemanda === 'disponivel') {
      continue;
    }

    if (demanda.alocacao) {
      sessaoFuncionariosComDemanda.add(demanda.alocacao.sessaoFuncionarioId);
    }

    if (
      demanda.statusDemanda === 'em_conferencia' &&
      demanda.conferente?.id != null
    ) {
      const funcionario = funcionarios.find(
        (item) => item.funcionarioId === demanda.conferente!.id,
      );

      if (funcionario) {
        sessaoFuncionariosComDemanda.add(funcionario.id);
      }
    }

    for (const apoio of demanda.apoios ?? []) {
      if (!isApoioAtivoStatus(apoio.status)) {
        continue;
      }

      const funcionario = funcionarios.find(
        (item) => item.funcionarioId === apoio.funcionarioId,
      );

      if (funcionario) {
        sessaoFuncionariosComDemanda.add(funcionario.id);
      }
    }
  }

  return sessaoFuncionariosComDemanda;
}
