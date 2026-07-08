'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  aprovarDivergenciaInventario,
  getInventario,
  listDemandas,
  listDivergenciasInventario,
  mapDemandaToProgressoItem,
  mapDivergenciaApiToItem,
  reprovarDivergenciaInventario,
  solicitarRecontagemDivergenciaInventario,
  updateInventarioStatus,
} from '@/features/inventario/lib/inventario-api';
import type {
  DemandaProgressoItem,
  DivergenciaFiltroStatus,
  DivergenciaItem,
  InventarioDetalheHeader,
  InventarioDetalheMetricas,
} from '@/features/inventario/types/inventario-detalhe.schema';

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  em_progresso: 'Em progresso',
  pausado: 'Pausado',
  concluido: 'Concluído',
};

export function useInventarioDetalhe(inventarioId: string) {

  const [pausando, setPausando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [processandoDivergenciaId, setProcessandoDivergenciaId] = useState<
    string | null
  >(null);
  const [filtroDivergencia, setFiltroDivergencia] =
    useState<DivergenciaFiltroStatus>('todas');
  const [inventarioConcluido, setInventarioConcluido] = useState(false);
  const [modoAprovacaoDivergencias, setModoAprovacaoDivergencias] =
    useState(false);
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
  const [demandas, setDemandas] = useState<DemandaProgressoItem[]>([]);
  const [divergencias, setDivergencias] = useState<DivergenciaItem[]>([]);
  const [divergenciasPendentesCount, setDivergenciasPendentesCount] =
    useState(0);
  const [divergenciasIdentificadasCount, setDivergenciasIdentificadasCount] =
    useState(0);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [detalhe, demandasApi, divergenciasApi] = await Promise.all([
        getInventario(inventarioId),
        listDemandas(inventarioId),
        listDivergenciasInventario(inventarioId).catch(() => ({ items: [] })),
      ]);

      const concluido = detalhe.status === 'concluido';
      const usandoPersistidas = divergenciasApi.items.length > 0;
      const modoAprovacao = concluido && usandoPersistidas;

      setInventarioConcluido(concluido);
      setModoAprovacaoDivergencias(modoAprovacao);

      setHeader({
        codigo: detalhe.codigo,
        statusLabel: STATUS_LABELS[detalhe.status] ?? detalhe.status,
        tempoDecorridoLabel: detalhe.startedAt
          ? new Date(detalhe.startedAt).toLocaleString('pt-BR')
          : '—',
      });

      const pendentesCount = usandoPersistidas
        ? divergenciasApi.items.filter((item) => item.status === 'pendente')
            .length
        : 0;
      const identificadasCount = usandoPersistidas
        ? divergenciasApi.items.length
        : detalhe.divergenciasCount;

      setDivergenciasPendentesCount(pendentesCount);
      setDivergenciasIdentificadasCount(identificadasCount);

      setMetricas({
        progressoPercent: detalhe.progressoPercent,
        itensContados: detalhe.itensContados,
        itensTotal: detalhe.itensTotal,
        acuraciaPercent: detalhe.acuraciaPercent ?? 0,
        metaDeltaLabel: '—',
        divergenciasCount: identificadasCount,
        impactoFinanceiroLabel: modoAprovacao
          ? pendentesCount > 0
            ? `${pendentesCount} pendente(s) de aprovação`
            : '—'
          : identificadasCount > 0
            ? `${identificadasCount} identificada(s) na prévia`
            : '—',
      });

      if (usandoPersistidas) {
        setDivergencias(divergenciasApi.items.map(mapDivergenciaApiToItem));
        setFiltroDivergencia((atual) =>
          atual === 'todas' ? 'pendente' : atual,
        );
      } else {
        setDivergencias(
          detalhe.divergencias.map((item) => ({
            id: item.id,
            sku: item.sku,
            produtoNome: item.produtoNome,
            setor: item.setor,
            endereco: item.endereco,
            esperadoLabel: item.esperadoLabel,
            encontradoLabel: item.encontradoLabel,
            diferencaLabel: item.diferencaLabel,
            tipo: item.tipo,
            podeAprovar: false,
          })),
        );
        setFiltroDivergencia('todas');
      }

      setDemandas(demandasApi.map(mapDemandaToProgressoItem));
    } catch {
      toast.error('Não foi possível carregar o inventário');
    } finally {
      setCarregando(false);
    }
  }, [inventarioId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const divergenciasFiltradas = useMemo(() => {
    if (!modoAprovacaoDivergencias || filtroDivergencia === 'todas') {
      return divergencias;
    }

    return divergencias.filter((item) => item.status === filtroDivergencia);
  }, [divergencias, filtroDivergencia, modoAprovacaoDivergencias]);

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
    const confirmMessage =
      divergencias.length > 0
        ? 'Ao finalizar, as divergências serão registradas para aprovação antes de ajustar o saldo. Deseja continuar?'
        : 'Deseja finalizar este inventário?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setFinalizando(true);
    try {
      await updateInventarioStatus(inventarioId, 'concluido');
      toast.success('Inventário finalizado', {
        description: 'Revise e aprove as divergências na seção abaixo.',
      });
      await carregar();
      setFiltroDivergencia('pendente');
      document
        .getElementById('inventario-divergencias')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      toast.error('Não foi possível finalizar o inventário');
    } finally {
      setFinalizando(false);
    }
  }, [carregar, divergencias.length, inventarioId]);

  const aprovarDivergencia = useCallback(
    async (divergenciaId: string) => {
      setProcessandoDivergenciaId(divergenciaId);
      try {
        await aprovarDivergenciaInventario(inventarioId, divergenciaId);
        toast.success('Divergência aprovada', {
          description: 'O ajuste de saldo será processado em segundo plano.',
        });
        await carregar();
      } catch {
        toast.error('Não foi possível aprovar a divergência');
      } finally {
        setProcessandoDivergenciaId(null);
      }
    },
    [carregar, inventarioId],
  );

  const reprovarDivergencia = useCallback(
    async (divergenciaId: string, motivoReprovacao: string) => {
      setProcessandoDivergenciaId(divergenciaId);
      try {
        await reprovarDivergenciaInventario(inventarioId, divergenciaId, {
          motivoReprovacao,
        });
        toast.success('Divergência reprovada');
        await carregar();
      } catch {
        toast.error('Não foi possível reprovar a divergência');
      } finally {
        setProcessandoDivergenciaId(null);
      }
    },
    [carregar, inventarioId],
  );

  const solicitarRecontagem = useCallback(
    async (
      divergenciaId: string,
      payload: {
        responsavelId: number;
        prioridade: 'baixa' | 'media' | 'alta' | 'critica';
        motivo?: string;
      },
    ) => {
      setProcessandoDivergenciaId(divergenciaId);
      try {
        const updated = await solicitarRecontagemDivergenciaInventario(
          inventarioId,
          divergenciaId,
          payload,
        );
        toast.success('Recontagem solicitada', {
          description: updated.recontagemAtual
            ? `Demanda atribuída a ${updated.recontagemAtual.responsavelNome}.`
            : 'A demanda foi criada para o operador selecionado.',
        });
        await carregar();
      } catch {
        toast.error('Não foi possível solicitar a recontagem');
      } finally {
        setProcessandoDivergenciaId(null);
      }
    },
    [carregar, inventarioId],
  );

  const irParaDivergencias = useCallback(() => {
    setFiltroDivergencia(
      modoAprovacaoDivergencias ? 'pendente' : 'todas',
    );
    document
      .getElementById('inventario-divergencias')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [modoAprovacaoDivergencias]);

  const exportarCsv = useCallback(() => {
    if (divergencias.length === 0) {
      toast.info('Sem divergências para exportar');
      return;
    }

    const header = [
      'SKU',
      'Produto',
      'Setor',
      'Endereço',
      'Esperado',
      'Encontrado',
      'Diferença',
      'Tipo',
      'Status',
    ];
    const rows = divergencias.map((item) => [
      item.sku,
      item.produtoNome,
      item.setor,
      item.endereco ?? '',
      item.esperadoLabel,
      item.encontradoLabel,
      item.diferencaLabel,
      item.tipo,
      item.status ?? '',
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `divergencias-${inventarioId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [divergencias, inventarioId]);

  const resumoDemandas = (() => {
    const total = demandas.length;
    const concluidas = demandas.filter((d) => d.status === 'concluida').length;
    const emAndamento = demandas.filter(
      (d) => d.status === 'em_andamento',
    ).length;
    const progressoMedio =
      total > 0
        ? Math.round(
            demandas.reduce((acc, d) => acc + d.progressPercent, 0) / total,
          )
        : 0;

    return { total, concluidas, emAndamento, progressoMedio };
  })();

  return {
    header,
    metricas,
    demandas,
    resumoDemandas,
    divergencias: divergenciasFiltradas,
    divergenciasPendentesCount,
    divergenciasIdentificadasCount,
    inventarioConcluido,
    modoAprovacaoDivergencias,
    filtroDivergencia,
    setFiltroDivergencia,
    aprovarDivergencia,
    reprovarDivergencia,
    solicitarRecontagem,
    processandoDivergenciaId,
    irParaDivergencias,
    pausar,
    finalizar,
    pausando,
    finalizando,
    carregando,
    exportarCsv,
  };
}
