import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import {
  buscarDemandaDevolucao,
  listarFaltasPesoDevolucao,
} from '@/features/devolucao/lib/devolucao-api';
import { useUnidade } from '@/features/unidade';
import {
  cacheDemandaDetalhe,
  getDemandaDetalhe,
} from '@/lib/offline/demand-detail-cache';

import { SEED_DEMANDS } from '../data/devolucao-seed';
import { db } from '@/lib/offline/db';

export function useDemandById(id: string) {
  const demand = useLiveQuery(async () => {
    const fromDb = await db.devolucaoDemands.get(id);
    if (fromDb) return fromDb;

    const byRoute = await db.devolucaoDemands.where('routeId').equals(id).first();
    if (byRoute) return byRoute;

    return SEED_DEMANDS.find((d) => d.routeId === id || d.id === id);
  }, [id]);

  return demand;
}

export function useDemandaDetalhe(demandId: string) {
  const { unidadeSelecionada } = useUnidade();
  const detalhe = useLiveQuery(() => getDemandaDetalhe(demandId), [demandId]);

  useEffect(() => {
    const unidadeId = unidadeSelecionada?.id;
    if (!unidadeId || !demandId) {
      return;
    }

    void Promise.all([
      buscarDemandaDevolucao(demandId, unidadeId),
      listarFaltasPesoDevolucao(demandId, unidadeId).catch(() => ({
        faltasPeso: [],
      })),
    ])
      .then(([response, faltasResponse]) =>
        cacheDemandaDetalhe(response, faltasResponse.faltasPeso),
      )
      .catch(() => {
        // mantém cache offline quando disponível
      });
  }, [demandId, unidadeSelecionada?.id]);

  return detalhe;
}
