'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  deleteDemanda,
  iniciarInventario,
  listDemandas,
  mapDemandaToUiItem,
} from '@/features/inventario/lib/inventario-api';
import type { DemandaContagemItem } from '@/features/inventario/types/inventario-lista.schema';

export function useInventarioDemanda(inventarioId: string) {
  const router = useRouter();

  const [demandas, setDemandas] = useState<DemandaContagemItem[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'cega' | 'validacao'>(
    'todas',
  );
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const items = await listDemandas(inventarioId);
      setDemandas(items.map(mapDemandaToUiItem));
    } catch {
      toast.error('Não foi possível carregar as demandas');
    } finally {
      setCarregando(false);
    }
  }, [inventarioId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const demandasFiltradas =
    filtroTipo === 'todas'
      ? demandas
      : demandas.filter((d) => d.tipo === filtroTipo);

  const resumo = (() => {
    const total = demandas.length;
    const cega = demandas.filter((d) => d.tipo === 'cega').length;
    const validacao = demandas.filter((d) => d.tipo === 'validacao').length;

    const avatares = demandas.slice(0, 3).map((d, i) => ({
      key: `${d.id}-av-${i}`,
      inicial: d.responsavelNome.charAt(0),
    }));

    return { total, cega, validacao, avatares, extras: Math.max(0, total - 3) };
  })();

  const irParaNovaDemanda = () => {
    router.push(`/inventario/${inventarioId}/demandas/nova`);
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

  const voltarCadastro = () => {
    router.push('/inventario/novo');
  };

  const salvarEIniciar = async () => {
    setSalvando(true);
    try {
      await iniciarInventario(inventarioId);
      toast.success('Inventário iniciado', {
        description: `${demandas.length} demanda(s) registrada(s).`,
      });
      router.push('/inventario');
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
    voltarCadastro,
    salvarEIniciar,
    salvando,
    carregando,
  };
}
