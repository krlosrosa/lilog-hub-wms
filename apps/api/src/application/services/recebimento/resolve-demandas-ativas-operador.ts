export type DemandaAtivaOperadorInput = {
  statusDemanda: string;
  alocacao: { sessaoFuncionarioId: string } | null;
  conferente: { id: number } | null;
};

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
    if (demanda.alocacao && demanda.statusDemanda !== 'disponivel') {
      sessaoFuncionariosComDemanda.add(demanda.alocacao.sessaoFuncionarioId);
      continue;
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
  }

  return sessaoFuncionariosComDemanda;
}
