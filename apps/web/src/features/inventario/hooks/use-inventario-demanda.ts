'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  deleteDemanda,
  iniciarInventario,
  listDemandas,
  mapDemandaToProgressoItem,
} from '@/features/inventario/lib/inventario-api';
import type { DemandaProgressoItem } from '@/features/inventario/types/inventario-detalhe.schema';

export function useInventarioDemanda(inventarioId: string) {
  const router = useRouter();

  const [demandas, setDemandas] = useState<DemandaProgressoItem[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'cega' | 'validacao'>(
    'todas',
  );
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const items = await listDemandas(inventarioId);
      setDemandas(items.map(mapDemandaToProgressoItem));
    } catch {
      toast.error('Não foi possível carregar as demandas');
    } finally {
      setCarregando(false);
    }
  }, [inventarioId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const demandasFiltradas = useMemo(
    () =>
      filtroTipo === 'todas'
        ? demandas
        : demandas.filter((d) => d.tipo === filtroTipo),
    [demandas, filtroTipo],
  );

  const resumo = useMemo(() => {
    const total = demandas.length;
    const cega = demandas.filter((d) => d.tipo === 'cega').length;
    const validacao = demandas.filter((d) => d.tipo === 'validacao').length;
    const concluidas = demandas.filter((d) => d.status === 'concluida').length;
    const emAndamento = demandas.filter((d) => d.status === 'em_andamento').length;
    const progressoMedio =
      total > 0
        ? Math.round(
            demandas.reduce((acc, d) => acc + d.progressPercent, 0) / total,
          )
        : 0;

    const avatares = demandas.slice(0, 3).map((d, i) => ({
      key: `${d.id}-av-${i}`,
      inicial: d.responsavelNome.charAt(0),
    }));

    return {
      total,
      cega,
      validacao,
      concluidas,
      emAndamento,
      progressoMedio,
      avatares,
      extras: Math.max(0, total - 3),
    };
  }, [demandas]);

  const irParaNovaDemanda = () => {
    router.push(`/inventario/${inventarioId}/demandas/nova`);
  };

  const voltarDetalhe = () => {
    router.push(`/inventario/${inventarioId}`);
  };

  const removerDemanda = async (id: string) => {
    try {
      await deleteDemanda(inventarioId, id);
      toast.info('Demanda removida');
      await carregar();
    } catch {
      toast.error('Não foi possível remover a demanda');
    }
  };

  const salvarEIniciar = async () => {
    setSalvando(true);
    try {
      await iniciarInventario(inventarioId);
      toast.success('Inventário iniciado', {
        description: `${demandas.length} demanda(s) registrada(s).`,
      });
      router.push(`/inventario/${inventarioId}`);
    } catch (error) {
      toast.error('Não foi possível iniciar o inventário', {
        description:
          error instanceof Error ? error.message : 'Verifique as demandas.',
      });
    } finally {
      setSalvando(false);
    }
  };

  return {
    demandas: demandasFiltradas,
    filtroTipo,
    setFiltroTipo,
    resumo,
    irParaNovaDemanda,
    removerDemanda,
    voltarDetalhe,
    salvarEIniciar,
    salvando,
    carregando,
  };
}
