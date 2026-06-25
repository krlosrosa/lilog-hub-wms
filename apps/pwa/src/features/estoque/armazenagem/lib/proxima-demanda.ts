import {
  fetchDemandasArmazenagem,
  type DemandaArmazenagemListItemApi,
} from './armazenagem-api';

export type ProximaDemandaArmazenagem = {
  id: string;
  label: string;
  origem: string;
};

function sortByPrioridade(
  demandas: DemandaArmazenagemListItemApi[],
): DemandaArmazenagemListItemApi[] {
  const priority = (status: DemandaArmazenagemListItemApi['status']) => {
    if (status === 'aguardando_inicio') return 0;
    if (status === 'em_andamento') return 1;
    return 2;
  };

  return [...demandas].sort((a, b) => priority(a.status) - priority(b.status));
}

export async function findProximaDemandaArmazenagem(
  unidadeId: string,
  currentDemandaId: string,
): Promise<ProximaDemandaArmazenagem | null> {
  const result = await fetchDemandasArmazenagem(unidadeId);
  const active = sortByPrioridade(
    result.items.filter(
      (demanda) =>
        demanda.id !== currentDemandaId &&
        demanda.status !== 'concluida' &&
        demanda.status !== 'cancelada',
    ),
  );

  const next = active[0];
  if (!next) return null;

  return {
    id: next.id,
    label: `#${next.id.slice(0, 8).toUpperCase()}`,
    origem: `Recebimento ${next.recebimentoId.slice(0, 8)}`,
  };
}
