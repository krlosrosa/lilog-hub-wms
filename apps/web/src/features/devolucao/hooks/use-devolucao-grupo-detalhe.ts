'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';
import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarStatusGrupoDescarga,
  buscarGrupoDescargaDevolucao,
  registrarConferenciaGrupo,
  type GrupoDescargaDetalhe,
} from '@/features/devolucao/lib/devolucao-api';
import {
  canConcluirGrupo,
  canLiberarGrupoConferencia,
} from '@/features/devolucao/types/devolucao-grupo-descarga.schema';

type ItemConferenciaDraft = {
  itemId: string;
  qtdConferida: string;
  condicao: string;
};

type ItemNaoContabilDraft = {
  sku: string;
  descricaoProduto: string;
  quantidadeConferida: string;
  unidadeMedida: string;
  observacao: string;
};

export function useDevolucaoGrupoDetalhe(grupoId: string) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<GrupoDescargaDetalhe | null>(null);
  const [itensDraft, setItensDraft] = useState<ItemConferenciaDraft[]>([]);
  const [itemNaoContabil, setItemNaoContabil] = useState<ItemNaoContabilDraft>({
    sku: '',
    descricaoProduto: '',
    quantidadeConferida: '',
    unidadeMedida: 'UN',
    observacao: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setLoadError('Selecione uma unidade para visualizar o grupo.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await buscarGrupoDescargaDevolucao(grupoId, unidadeId);
      setDetalhe(response);
      setItensDraft(
        response.itensEsperados.map((item) => ({
          itemId: item.itemId,
          qtdConferida:
            item.qtdConferida !== null ? String(item.qtdConferida) : String(item.quantidade),
          condicao: item.condicao,
        })),
      );
    } catch {
      setLoadError('Não foi possível carregar o grupo de descarga.');
    } finally {
      setIsLoading(false);
    }
  }, [grupoId, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  const updateItemDraft = useCallback(
    (itemId: string, patch: Partial<ItemConferenciaDraft>) => {
      setItensDraft((prev) =>
        prev.map((item) =>
          item.itemId === itemId ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const itensPendentes = useMemo(() => {
    if (!detalhe) return 0;
    return detalhe.itensEsperados.filter((item) => item.qtdConferida === null).length;
  }, [detalhe]);

  const salvarConferencia = useCallback(async () => {
    if (!unidadeId || !detalhe) return { success: false as const };

    setIsSaving(true);
    try {
      const itens = itensDraft.map((item) => ({
        itemId: item.itemId,
        qtdConferida: Number(item.qtdConferida),
        condicao: item.condicao,
      }));

      await registrarConferenciaGrupo(grupoId, {
        unidadeId,
        itens,
      });

      toast.success('Conferência do grupo salva.');
      await carregarDetalhe();
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a conferência.';
      toast.error(message);
      return { success: false as const };
    } finally {
      setIsSaving(false);
    }
  }, [carregarDetalhe, detalhe, grupoId, itensDraft, unidadeId]);

  const registrarItemNaoContabil = useCallback(async () => {
    if (!unidadeId || !detalhe) return { success: false as const };
    if (!itemNaoContabil.sku.trim() || !itemNaoContabil.quantidadeConferida.trim()) {
      toast.error('Informe SKU e quantidade do item não contábil.');
      return { success: false as const };
    }

    setIsSaving(true);
    try {
      await registrarConferenciaGrupo(grupoId, {
        unidadeId,
        itensNaoContabeis: [
          {
            sku: itemNaoContabil.sku.trim(),
            descricaoProduto: itemNaoContabil.descricaoProduto.trim() || null,
            quantidadeConferida: Number(itemNaoContabil.quantidadeConferida),
            unidadeMedida: itemNaoContabil.unidadeMedida.trim() || 'UN',
            observacao: itemNaoContabil.observacao.trim() || null,
            condicao: 'nao_identificado',
          },
        ],
      });

      toast.success('Item não contábil registrado.');
      setItemNaoContabil({
        sku: '',
        descricaoProduto: '',
        quantidadeConferida: '',
        unidadeMedida: 'UN',
        observacao: '',
      });
      await carregarDetalhe();
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível registrar o item.';
      toast.error(message);
      return { success: false as const };
    } finally {
      setIsSaving(false);
    }
  }, [carregarDetalhe, detalhe, grupoId, itemNaoContabil, unidadeId]);

  const liberarConferencia = useCallback(async () => {
    if (!unidadeId || !detalhe) return { success: false as const };

    setIsSaving(true);
    try {
      await atualizarStatusGrupoDescarga(grupoId, {
        unidadeId,
        status: 'em_conferencia',
      });
      toast.success('Grupo liberado para conferência.');
      await carregarDetalhe();
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível liberar o grupo.';
      toast.error(message);
      return { success: false as const };
    } finally {
      setIsSaving(false);
    }
  }, [carregarDetalhe, detalhe, grupoId, unidadeId]);

  const concluirGrupo = useCallback(async () => {
    if (!unidadeId || !detalhe) return { success: false as const };

    setIsSaving(true);
    try {
      await atualizarStatusGrupoDescarga(grupoId, {
        unidadeId,
        status: 'concluida',
        observacao: 'Grupo de descarga concluído',
      });
      toast.success('Grupo concluído.');
      router.push('/devolucao');
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível concluir o grupo.';
      toast.error(message);
      return { success: false as const };
    } finally {
      setIsSaving(false);
    }
  }, [detalhe, grupoId, router, unidadeId]);

  return {
    isLoading,
    loadError,
    detalhe,
    itensDraft,
    updateItemDraft,
    itemNaoContabil,
    setItemNaoContabil,
    itensPendentes,
    isSaving,
    salvarConferencia,
    registrarItemNaoContabil,
    liberarConferencia,
    concluirGrupo,
    canLiberar: detalhe ? canLiberarGrupoConferencia(detalhe.status) : false,
    canConcluir: detalhe ? canConcluirGrupo(detalhe.status) : false,
    unidadeId,
  };
}
