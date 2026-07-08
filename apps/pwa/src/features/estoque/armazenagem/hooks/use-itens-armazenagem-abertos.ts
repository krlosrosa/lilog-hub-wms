import { useCallback, useEffect, useState } from 'react';

import { useUnidade } from '@/features/unidade/lib/unidade-context';
import { hapticMedium } from '@/lib/haptics';

import {
  fetchDemandaArmazenagem,
  fetchDemandasArmazenagem,
} from '../lib/armazenagem-api';

export type ArmazenagemItemAberto = {
  id: string;
  demandaId: string;
  demandaRef: string;
  codigo: string;
  produtoNome: string;
  produtoSku: string | null;
  enderecoSugerido: string;
  sequencia: number;
  status: 'pendente' | 'em_andamento' | 'divergente';
  priority: 'urgente' | 'normal';
};

const OPEN_TAREFA_STATUS = new Set(['pendente', 'em_andamento', 'divergente']);
const OPEN_ITEM_STATUS = new Set(['pendente', 'em_andamento', 'divergente']);

async function loadItensAbertos(unidadeId: string): Promise<ArmazenagemItemAberto[]> {
  const result = await fetchDemandasArmazenagem(unidadeId);
  const activeDemandas = result.items.filter(
    (demanda) =>
      demanda.status !== 'concluida' &&
      demanda.status !== 'cancelada' &&
      demanda.status !== 'aguardando_validacao',
  );

  const details = await Promise.all(
    activeDemandas.map(async (demanda) => {
      try {
        return await fetchDemandaArmazenagem(demanda.id);
      } catch {
        return null;
      }
    }),
  );

  const itens: ArmazenagemItemAberto[] = [];

  for (let index = 0; index < activeDemandas.length; index += 1) {
    const demanda = activeDemandas[index];
    const detail = details[index];
    if (!detail) continue;

    const priority = demanda.status === 'aguardando_inicio' ? 'urgente' : 'normal';
    const demandaRef = `#${demanda.id.slice(0, 8).toUpperCase()}`;

    if (detail.tarefas && detail.tarefas.length > 0) {
      for (const tarefa of detail.tarefas) {
        if (!OPEN_TAREFA_STATUS.has(tarefa.status)) continue;

        const itemPrincipal = tarefa.itens[0];
        itens.push({
          id: tarefa.id,
          demandaId: demanda.id,
          demandaRef,
          codigo:
            tarefa.unitizadorCodigo ??
            `PAL-${String(tarefa.sequencia).padStart(4, '0')}`,
          produtoNome: itemPrincipal?.produtoNome ?? `Palete ${tarefa.sequencia}`,
          produtoSku: itemPrincipal?.produtoSku ?? null,
          enderecoSugerido:
            tarefa.enderecoSugeridoLabel ??
            itemPrincipal?.enderecoSugeridoLabel ??
            '—',
          sequencia: tarefa.sequencia,
          status: tarefa.status as ArmazenagemItemAberto['status'],
          priority,
        });
      }
      continue;
    }

    for (const item of detail.itens) {
      if (!OPEN_ITEM_STATUS.has(item.status)) continue;

      itens.push({
        id: item.id,
        demandaId: demanda.id,
        demandaRef,
        codigo: item.unitizadorCodigo ?? item.produtoSku ?? item.produtoId,
        produtoNome: item.produtoNome ?? 'Produto',
        produtoSku: item.produtoSku,
        enderecoSugerido: item.enderecoSugeridoLabel ?? '—',
        sequencia: 0,
        status: item.status as ArmazenagemItemAberto['status'],
        priority,
      });
    }
  }

  return itens.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === 'urgente' ? -1 : 1;
    }
    return a.sequencia - b.sequencia;
  });
}

export function useItensArmazenagemAbertos(enabled = true) {
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [itens, setItens] = useState<ArmazenagemItemAberto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!unidadeId) {
      setItens([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await loadItensAbertos(unidadeId);
      setItens(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar itens');
      setItens([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticMedium();
    await load();
    setIsRefreshing(false);
  }, [load]);

  return {
    itens,
    isLoading,
    isRefreshing,
    error,
    isEmpty: !isLoading && itens.length === 0,
    refresh,
  };
}
