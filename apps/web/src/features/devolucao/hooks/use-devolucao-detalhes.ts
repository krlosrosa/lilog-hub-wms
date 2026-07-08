'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FinalizarDevolucaoOpcoes } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import type { LiberarArmazemFormValues } from '@/features/devolucao/components/modal-liberar-armazem';
import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarStatusDemanda,
  buscarDemandaDevolucao,
  deletarDemandaDevolucao,
  getDocumentDownloadUrl,
  listarAvariasDevolucao,
  listarFaltasPesoDevolucao,
  listChecklistDevolucaoDocumentos,
  registrarFaltaPesoDevolucao,
  atualizarFaltaPesoDevolucao,
  type AtualizarStatusDemandaPayload,
} from '@/features/devolucao/lib/devolucao-api';
import { isFaltaPesoAtiva } from '@/features/devolucao/lib/falta-peso-status';
import {
  hasItensPesoVariavel,
  resolveFaltasPesoAtivasPorItem,
  resolveItensPesoVariavelElegiveis,
} from '@/features/devolucao/lib/resolve-itens-peso-variavel';
import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '@/features/recebimento/lib/checklist-photo-label';
import {
  mapApiToDemandaDetalhe,
  mapEventosToTimeline,
  mapItensToConferenceItems,
} from '@/features/devolucao/lib/devolucao-detalhes-mappers';
import {
  itemHasAvaria,
} from '@/features/devolucao/lib/resolve-avarias-for-item';
import type {
  ConferenceItem,
  ConferenceItemCondicaoFiltro,
  DemandaDetalhe,
  TimelineStep,
} from '@/features/devolucao/types/devolucao-detalhes.schema';
import { canFinalizarDemanda, canDeletarDemanda, canLiberarArmazem, canRegistrarDemandaFalta } from '@/features/devolucao/types/devolucao-detalhes.schema';
import type {
  BuscarDemandaDevolucaoResponse,
  DevolucaoAvariaDetalhe,
  DevolucaoChecklistDetalhe,
  DevolucaoNotaFiscalDetalhe,
} from '@/features/devolucao/types/devolucao-buscar.schema';
import type { FaltaPesoDetalhe } from '@/features/devolucao/types/devolucao-falta-peso.schema';
import type { FaltaPesoFormValues } from '@/features/devolucao/components/modal-registrar-falta-peso';
import type { ChecklistFoto } from '@/features/devolucao/types/devolucao-checklist.schema';

const PAGE_SIZE = 5;

type ActionResult = { success: true } | { success: false; error: string };

export function useDevolucaoDetalhes(id: string) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<DemandaDetalhe | null>(null);
  const [conferenceItems, setConferenceItems] = useState<ConferenceItem[]>([]);
  const [avarias, setAvarias] = useState<DevolucaoAvariaDetalhe[]>([]);
  const [filtroCondicao, setFiltroCondicaoState] =
    useState<ConferenceItemCondicaoFiltro>('todos');
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [checklist, setChecklist] = useState<DevolucaoChecklistDetalhe | null>(
    null,
  );
  const [checklistFotos, setChecklistFotos] = useState<ChecklistFoto[]>([]);
  const [checklistFotoTotal, setChecklistFotoTotal] = useState(0);
  const [isFinalizarOpen, setIsFinalizarOpen] = useState(false);
  const [isLiberarArmazemOpen, setIsLiberarArmazemOpen] = useState(false);
  const [isDemandaFaltaOpen, setIsDemandaFaltaOpen] = useState(false);
  const [isRegistrarFaltaPesoOpen, setIsRegistrarFaltaPesoOpen] = useState(false);
  const [isDeletarOpen, setIsDeletarOpen] = useState(false);
  const [notasFiscais, setNotasFiscais] = useState<DevolucaoNotaFiscalDetalhe[]>(
    [],
  );
  const [faltasPeso, setFaltasPeso] = useState<FaltaPesoDetalhe[]>([]);
  const [faltaPesoEmEdicao, setFaltaPesoEmEdicao] =
    useState<FaltaPesoDetalhe | null>(null);

  const applyResponse = useCallback((response: BuscarDemandaDevolucaoResponse) => {
    setDetalhe(mapApiToDemandaDetalhe(response));
    setConferenceItems(mapItensToConferenceItems(response));
    setTimeline(mapEventosToTimeline(response));
    setChecklist(response.checklist);
    setChecklistFotoTotal(response.checklist?.photoCount ?? 0);
    setNotasFiscais(response.notasFiscais);
  }, []);

  const carregarChecklistFotos = useCallback(async (demandaId: string) => {
    try {
      const documentos = await listChecklistDevolucaoDocumentos(demandaId);
      const sorted = [...documentos].sort((a, b) =>
        compareChecklistPhotos(a.nome, b.nome),
      );

      const fotos = await Promise.all(
        sorted.map(async (documento) => ({
          id: documento.id,
          legenda: resolveChecklistPhotoLabel(documento.nome),
          url: await getDocumentDownloadUrl(documento.id),
        })),
      );

      setChecklistFotos(fotos);
      setChecklistFotoTotal((prev) => Math.max(prev, fotos.length));
    } catch {
      setChecklistFotos([]);
    }
  }, []);

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setLoadError('Selecione uma unidade para visualizar a demanda.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await buscarDemandaDevolucao(id, unidadeId);
      applyResponse(response);

      try {
        const avariasResponse = await listarAvariasDevolucao(id, unidadeId);
        setAvarias(avariasResponse.avarias);
      } catch {
        setAvarias([]);
      }

      try {
        const faltasResponse = await listarFaltasPesoDevolucao(id, unidadeId);
        setFaltasPeso(faltasResponse.faltasPeso);
      } catch {
        setFaltasPeso([]);
      }

      await carregarChecklistFotos(id);
    } catch {
      setLoadError('Não foi possível carregar os detalhes da demanda.');
    } finally {
      setIsLoading(false);
    }
  }, [applyResponse, carregarChecklistFotos, id, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  const setFiltroCondicao = useCallback((filtro: ConferenceItemCondicaoFiltro) => {
    setFiltroCondicaoState(filtro);
    setPagina(1);
  }, []);

  const conferenceItemsWithFalta = useMemo(() => {
    const faltasPorItem = resolveFaltasPesoAtivasPorItem(faltasPeso);

    return conferenceItems.map((item) => {
      const faltaPeso = faltasPorItem.get(item.id);

      if (!faltaPeso) {
        return {
          ...item,
          diferencaPesoKg: null,
          quantidadeFiscalOriginal: null,
          faltaPesoId: null,
        };
      }

      const previstoContabil = Math.round(
        faltaPeso.quantidadeContabilConsiderada,
      );
      const confirmado = Math.round(item.confirmado);
      const zerouContabil = faltaPeso.zerarQuantidadeContabil;

      return {
        ...item,
        previsto: previstoContabil,
        confirmado,
        status: zerouContabil ? ('ajuste-peso' as const) : item.status,
        diferencaPesoKg: faltaPeso.pesoFaltanteKg,
        quantidadeFiscalOriginal: zerouContabil
          ? faltaPeso.quantidadeFiscalOriginal
          : null,
        faltaPesoId: faltaPeso.id,
      };
    });
  }, [conferenceItems, faltasPeso]);

  const filteredConferenceItems = useMemo(() => {
    if (filtroCondicao === 'todos') return conferenceItemsWithFalta;
    if (filtroCondicao === 'avariado') {
      return conferenceItemsWithFalta.filter((item) =>
        itemHasAvaria(item, avarias),
      );
    }
    return conferenceItemsWithFalta.filter(
      (item) => item.condicao === filtroCondicao,
    );
  }, [avarias, conferenceItemsWithFalta, filtroCondicao]);

  const contagemPorCondicao = useMemo(() => {
    const counts: Record<ConferenceItemCondicaoFiltro, number> = {
      todos: conferenceItemsWithFalta.length,
      integro: 0,
      avariado: 0,
      vencido: 0,
      violado: 0,
      nao_identificado: 0,
    };

    conferenceItemsWithFalta.forEach((item) => {
      if (itemHasAvaria(item, avarias)) {
        counts.avariado += 1;
        return;
      }

      counts[item.condicao] += 1;
    });

    return counts;
  }, [avarias, conferenceItemsWithFalta]);

  const totalSkus = filteredConferenceItems.length;

  const totalPaginas = Math.max(1, Math.ceil(totalSkus / PAGE_SIZE));

  const itemsPagina = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return filteredConferenceItems.slice(start, start + PAGE_SIZE);
  }, [filteredConferenceItems, pagina]);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const runStatusUpdate = useCallback(
    async (
      status: BuscarDemandaDevolucaoResponse['status'],
      observacao?: string,
      extras?: Partial<AtualizarStatusDemandaPayload>,
    ): Promise<ActionResult> => {
      if (!unidadeId) {
        return { success: false, error: 'Unidade não selecionada.' };
      }

      setIsLoading(true);

      try {
        await atualizarStatusDemanda(id, unidadeId, {
          status,
          observacao,
          ...extras,
        });
        await carregarDetalhe();
        return { success: true };
      } catch {
        return {
          success: false,
          error: 'Não foi possível atualizar o status da demanda.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [carregarDetalhe, id, unidadeId],
  );

  const finalizarProcesso = useCallback(
    async (opcoes: FinalizarDevolucaoOpcoes): Promise<ActionResult> => {
      if (
        !canFinalizarDemanda(
          detalhe?.status ?? 'aguardando',
          detalhe?.statusDb,
        )
      ) {
        return {
          success: false,
          error: 'Só é possível finalizar demandas com status Conferido.',
        };
      }

      const result = await runStatusUpdate('concluida', 'Processo finalizado');
      if (!result.success) return result;

      if (opcoes.liberarDoca) {
        // Liberar doca permanece simulado até integração com docas
      }

      setIsFinalizarOpen(false);
      return { success: true };
    },
    [detalhe?.status, detalhe?.statusDb, runStatusUpdate],
  );

  const openFinalizar = useCallback(() => {
    if (
      !canFinalizarDemanda(
        detalhe?.status ?? 'aguardando',
        detalhe?.statusDb,
      )
    ) {
      return;
    }

    setIsFinalizarOpen(true);
  }, [detalhe?.status, detalhe?.statusDb]);

  const closeFinalizar = useCallback(() => {
    if (!isLoading) setIsFinalizarOpen(false);
  }, [isLoading]);

  const confirmarFinalizar = useCallback(
    async (opcoes: FinalizarDevolucaoOpcoes) => finalizarProcesso(opcoes),
    [finalizarProcesso],
  );

  const reabrirDemanda = useCallback(async (): Promise<ActionResult> => {
    return runStatusUpdate('em_execucao', 'Demanda reaberta para conferência');
  }, [runStatusUpdate]);

  const liberarArmazem = useCallback(
    async (values: LiberarArmazemFormValues): Promise<ActionResult> => {
      if (
        !canLiberarArmazem(
          detalhe?.status ?? 'aguardando',
          detalhe?.statusDb,
        )
      ) {
        return {
          success: false,
          error: 'Só é possível liberar para armazém demandas com status Aberta.',
        };
      }

      const result = await runStatusUpdate(
        'em_analise',
        'Liberado para armazém — aguardando conferência',
        {
          doca: values.doca,
          cargaSegregada: values.cargaSegregada,
          paletesEsperados: values.paletesEsperados,
        },
      );

      if (result.success) {
        setIsLiberarArmazemOpen(false);
      }

      return result;
    },
    [detalhe?.status, detalhe?.statusDb, runStatusUpdate],
  );

  const registrarDemandaFalta = useCallback(async (): Promise<ActionResult> => {
    if (!unidadeId) {
      return { success: false, error: 'Unidade não selecionada.' };
    }

    if (
      !canRegistrarDemandaFalta(
        detalhe?.status ?? 'aguardando',
        detalhe?.statusDb,
      )
    ) {
      return {
        success: false,
        error: 'Demanda de falta só pode ser registrada com status Aberta.',
      };
    }

    setIsLoading(true);

    try {
      await atualizarStatusDemanda(id, unidadeId, {
        status: 'concluida',
        observacao: 'Demanda de falta registrada — sem item físico para receber',
      });
      await carregarDetalhe();
      setIsDemandaFaltaOpen(false);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Não foi possível registrar a demanda de falta.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [carregarDetalhe, detalhe?.status, detalhe?.statusDb, id, unidadeId]);

  const salvarFaltaPeso = useCallback(
    async (values: FaltaPesoFormValues): Promise<ActionResult> => {
      if (!unidadeId) {
        return { success: false, error: 'Unidade não selecionada.' };
      }

      setIsLoading(true);

      try {
        if (values.faltaPesoId) {
          await atualizarFaltaPesoDevolucao(id, values.faltaPesoId, {
            unidadeId,
            diferencaKg: values.diferencaKg,
            zerarQuantidadeContabil: values.zerarQuantidadeContabil,
            observacao: values.observacao || null,
          });
        } else {
          if (!values.notaFiscalId) {
            return {
              success: false,
              error: 'Nota fiscal do item não encontrada.',
            };
          }

          await registrarFaltaPesoDevolucao(id, {
            unidadeId,
            notaFiscalId: values.notaFiscalId,
            itemId: values.itemId,
            sku: values.sku,
            diferencaKg: values.diferencaKg,
            zerarQuantidadeContabil: values.zerarQuantidadeContabil,
            observacao: values.observacao || null,
          });
        }

        await carregarDetalhe();
        setIsRegistrarFaltaPesoOpen(false);
        setFaltaPesoEmEdicao(null);
        return { success: true };
      } catch {
        return {
          success: false,
          error: values.faltaPesoId
            ? 'Não foi possível atualizar a diferença de peso.'
            : 'Não foi possível registrar a falta de peso.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [carregarDetalhe, id, unidadeId],
  );

  const deletarDemanda = useCallback(async (): Promise<ActionResult> => {
    if (!unidadeId) {
      return { success: false, error: 'Unidade não selecionada.' };
    }

    if (
      !canDeletarDemanda(
        detalhe?.status ?? 'aguardando',
        detalhe?.statusDb,
      )
    ) {
      return {
        success: false,
        error: 'Não é possível deletar demandas finalizadas.',
      };
    }

    setIsLoading(true);

    try {
      await deletarDemandaDevolucao(id, unidadeId);
      setIsDeletarOpen(false);
      router.push('/devolucao');
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Não foi possível deletar a demanda.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [detalhe?.status, detalhe?.statusDb, id, router, unidadeId]);

  const imprimirRelatorio = useCallback(async (): Promise<ActionResult> => {
    setIsLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 600);
    });
    setIsLoading(false);
    return { success: true };
  }, []);

  const openLiberarArmazem = useCallback(() => {
    if (
      !canLiberarArmazem(
        detalhe?.status ?? 'aguardando',
        detalhe?.statusDb,
      )
    ) {
      return;
    }

    setIsLiberarArmazemOpen(true);
  }, [detalhe?.status, detalhe?.statusDb]);

  const closeLiberarArmazem = useCallback(() => {
    if (!isLoading) setIsLiberarArmazemOpen(false);
  }, [isLoading]);

  const itensPesoVariavelElegiveis = useMemo(
    () => resolveItensPesoVariavelElegiveis(notasFiscais, faltasPeso),
    [faltasPeso, notasFiscais],
  );

  const faltasPesoEditaveis = useMemo(
    () => faltasPeso.filter((falta) => isFaltaPesoAtiva(falta.status)),
    [faltasPeso],
  );

  const temItensPesoVariavel = useMemo(
    () => hasItensPesoVariavel(notasFiscais),
    [notasFiscais],
  );

  const detalheFallback: DemandaDetalhe = detalhe ?? {
    id,
    codigoDemanda: '—',
    placa: '—',
    motorista: '—',
    viagemId: '—',
    status: 'aguardando',
    totalItens: 0,
    totalItensEsperado: 1,
    temperaturaBau: null,
    temperaturaBauAlvo: null,
    temperaturaProduto: null,
    temperaturaProdutoAlvo: null,
    inicioOperacao: '—',
    duracao: '—',
    estimativaTermino: '—',
    eficiencia: null,
  };

  return {
    isLoading,
    loadError,
    unidadeId,
    detalhe: detalheFallback,
    notasFiscais,
    faltasPeso,
    faltasPesoEditaveis,
    faltaPesoEmEdicao,
    itensPesoVariavelElegiveis,
    temItensPesoVariavel,
    conferenceItems: itemsPagina,
    allConferenceItems: conferenceItemsWithFalta,
    filteredConferenceItems,
    avarias,
    filtroCondicao,
    setFiltroCondicao,
    contagemPorCondicao,
    timeline,
    checklist,
    checklistFotos,
    checklistFotoTotal,
    pagina,
    setPagina,
    totalPaginas,
    totalSkus,
    pageSize: PAGE_SIZE,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    reabrirDemanda,
    liberarArmazem,
    registrarDemandaFalta,
    salvarFaltaPeso,
    deletarDemanda,
    imprimirRelatorio,
    isLiberarArmazemOpen,
    openLiberarArmazem,
    closeLiberarArmazem,
    isDemandaFaltaOpen,
    openDemandaFalta: () => {
      if (
        !canRegistrarDemandaFalta(
          detalhe?.status ?? 'aguardando',
          detalhe?.statusDb,
        )
      ) {
        return;
      }

      setIsDemandaFaltaOpen(true);
    },
    closeDemandaFalta: () => {
      if (!isLoading) setIsDemandaFaltaOpen(false);
    },
    isRegistrarFaltaPesoOpen,
    openRegistrarFaltaPeso: () => {
      setFaltaPesoEmEdicao(null);
      setIsRegistrarFaltaPesoOpen(true);
    },
    openEditarFaltaPeso: (falta: FaltaPesoDetalhe) => {
      setFaltaPesoEmEdicao(falta);
      setIsRegistrarFaltaPesoOpen(true);
    },
    closeRegistrarFaltaPeso: () => {
      if (!isLoading) {
        setIsRegistrarFaltaPesoOpen(false);
        setFaltaPesoEmEdicao(null);
      }
    },
    isDeletarOpen,
    openDeletar: () => {
      if (
        !canDeletarDemanda(
          detalhe?.status ?? 'aguardando',
          detalhe?.statusDb,
        )
      ) {
        return;
      }

      setIsDeletarOpen(true);
    },
    closeDeletar: () => {
      if (!isLoading) setIsDeletarOpen(false);
    },
    recarregar: carregarDetalhe,
  };
}
