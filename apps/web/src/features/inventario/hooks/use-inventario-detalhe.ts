'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  getInventario,
  updateInventarioStatus,
} from '@/features/inventario/lib/inventario-api';
import type {
  DivergenciaItem,
  InventarioDetalheHeader,
  InventarioDetalheMetricas,
  MembroProdutividade,
  SetorProgresso,
} from '@/features/inventario/types/inventario-detalhe.schema';

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  em_progresso: 'Em progresso',
  pausado: 'Pausado',
  concluido: 'Concluído',
};

export function useInventarioDetalhe(inventarioId: string) {
  const router = useRouter();

  const [pausando, setPausando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [header, setHeader] = useState<InventarioDetalheHeader>({
    codigo: '—',
    statusLabel: '—',
    tempoDecorridoLabel: '—',
  });
  const [metricas, setMetricas] = useState<InventarioDetalheMetricas>({
    progressoPercent: 0,
    itensContados: 0,
    itensTotal: 0,
    acuraciaPercent: 0,
    metaDeltaLabel: '—',
    divergenciasCount: 0,
    impactoFinanceiroLabel: '—',
  });
  const [setores, setSetores] = useState<SetorProgresso[]>([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const detalhe = await getInventario(inventarioId);
      setHeader({
        codigo: detalhe.codigo,
        statusLabel: STATUS_LABELS[detalhe.status] ?? detalhe.status,
        tempoDecorridoLabel: detalhe.startedAt
          ? new Date(detalhe.startedAt).toLocaleString('pt-BR')
          : '—',
      });
      setMetricas({
        progressoPercent: detalhe.progressoPercent,
        itensContados: detalhe.itensContados,
        itensTotal: detalhe.itensTotal,
        acuraciaPercent: detalhe.acuraciaPercent ?? 0,
        metaDeltaLabel: '—',
        divergenciasCount: detalhe.divergenciasCount,
        impactoFinanceiroLabel: '—',
      });
      setSetores(
        detalhe.setoresProgresso.map((setor) => ({
          id: setor.id,
          nome: setor.nome,
          iconName: 'grid' as const,
          statusLabel:
            setor.progressPercent >= 100 ? 'Concluído' : 'Em andamento',
          statusTone:
            setor.progressPercent >= 100 ? ('accent' as const) : ('primary' as const),
          progressPercent: setor.progressPercent,
          skuContados: setor.skuContados,
          skuTotal: setor.skuTotal,
          acuraciaLabel: null,
        })),
      );
    } catch {
      toast.error('Não foi possível carregar o inventário');
    } finally {
      setCarregando(false);
    }
  }, [inventarioId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const pausar = useCallback(async () => {
    setPausando(true);
    try {
      await updateInventarioStatus(inventarioId, 'pausado');
      toast.success('Inventário pausado', { description: inventarioId });
      await carregar();
    } catch {
      toast.error('Não foi possível pausar o inventário');
    } finally {
      setPausando(false);
    }
  }, [carregar, inventarioId]);

  const finalizar = useCallback(async () => {
    setFinalizando(true);
    try {
      await updateInventarioStatus(inventarioId, 'concluido');
      toast.success('Inventário finalizado', { description: inventarioId });
      router.push('/inventario');
    } catch {
      toast.error('Não foi possível finalizar o inventário');
    } finally {
      setFinalizando(false);
    }
  }, [inventarioId, router]);

  const verTodasDivergencias = useCallback(() => {
    toast.info('Sem divergências registradas neste MVP');
  }, []);

  const exportarCsv = useCallback(() => {
    toast.info('Exportação indisponível neste MVP');
  }, []);

  return {
    header,
    metricas,
    setores,
    divergencias: [] as DivergenciaItem[],
    membros: [] as MembroProdutividade[],
    eficienciaTimePercent: metricas.progressoPercent,
    pausar,
    finalizar,
    pausando,
    finalizando,
    carregando,
    verTodasDivergencias,
    exportarCsv,
  };
}
