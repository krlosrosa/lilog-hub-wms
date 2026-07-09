'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { getProduto, listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '@/features/recebimento/lib/checklist-photo-label';
import {
  cancelPreRecebimento,
  fetchChecklist,
  finalizarRecebimento,
  getDocumentDownloadUrl,
  getPreRecebimento,
  getRecebimentoByPreRecebimento,
  liberarConferencia,
  recepcionarCarro,
  listAvariaDocumentos,
  listAvarias,
  listChecklistDocumentos,
  reabrirConferencia,
  reimprimirEtiquetasRecebimento,
} from '@/features/recebimento/lib/recebimento-api';
import {
  alocarFotosPorAvaria,
  enrichConferenciaComAvarias,
} from '@/features/recebimento/lib/enrich-conferencia-avarias';
import { mapRecebimentoDetalhe } from '@/features/recebimento/lib/map-recebimento-detalhe';
import type { RecebimentoDetalhe } from '@/features/recebimento/types/recebimento-detalhe.schema';
import type { RecepcionarCarroPayload } from '@/features/recebimento/types/recebimento.api';
import { ApiClientError } from '@/lib/api';

const CONFERENCIA_PAGE_SIZE = 4;

async function buildProdutoMap(
  produtoIds: string[],
): Promise<Map<string, ProdutoApi>> {
  if (!produtoIds.length) {
    return new Map();
  }

  const uniqueIds = new Set(produtoIds);
  const map = new Map<string, ProdutoApi>();

  const PAGE_SIZE = 100;
  let page = 1;

  // Percorre as páginas de produtos até encontrar todos os IDs necessários
  // ou até esgotar as páginas disponíveis.
  // Isso evita depender apenas da primeira página da listagem.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await listProdutos({ page, limit: PAGE_SIZE });

    for (const produto of response.items) {
      if (uniqueIds.has(produto.produtoId)) {
        map.set(produto.produtoId, produto);
        uniqueIds.delete(produto.produtoId);
      }
    }

    const reachedLastPage = response.page * response.limit >= response.total;
    const resolvedAllIds = uniqueIds.size === 0;

    if (reachedLastPage || resolvedAllIds) {
      break;
    }

    page += 1;
  }

  // Se ainda houver IDs não resolvidos pela listagem paginada,
  // tenta buscar cada produto individualmente pelo endpoint /produtos/:id.
  if (uniqueIds.size > 0) {
    const unresolvedIds = Array.from(uniqueIds);

    const resolvedIndividually = await Promise.all(
      unresolvedIds.map(async (id) => {
        try {
          return await getProduto(id);
        } catch {
          return null;
        }
      }),
    );

    for (const produto of resolvedIndividually) {
      if (produto && uniqueIds.has(produto.produtoId)) {
        map.set(produto.produtoId, produto);
        uniqueIds.delete(produto.produtoId);
      }
    }
  }

  return map;
}

export function useRecebimentoDetalhe(recebimentoId: string) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recebimento, setRecebimento] = useState<RecebimentoDetalhe | null>(
    null,
  );
  const [paginaConferencia, setPaginaConferenciaState] = useState(1);
  const [isLiberarOpen, setIsLiberarOpen] = useState(false);
  const [isRecepcionarOpen, setIsRecepcionarOpen] = useState(false);
  const [isFinalizarOpen, setIsFinalizarOpen] = useState(false);
  const [isExcluirOpen, setIsExcluirOpen] = useState(false);
  const [isLinkRastreioOpen, setIsLinkRastreioOpen] = useState(false);
  const [isImportOfflineOpen, setIsImportOfflineOpen] = useState(false);

  const carregar = useCallback(async () => {
    setIsLoading(true);

    try {
      const preRecebimento = await getPreRecebimento(recebimentoId);
      const recebimentoAtivo = await getRecebimentoByPreRecebimento(
        recebimentoId,
      );

      const produtoIds = [
        ...(preRecebimento.itens?.map((item) => item.produtoId) ?? []),
        ...(recebimentoAtivo?.itens?.map((item) => item.produtoId) ?? []),
      ];

      const [produtoMap, checklist] = await Promise.all([
        buildProdutoMap([...new Set(produtoIds)]),
        recebimentoAtivo
          ? fetchChecklist(recebimentoAtivo.id)
          : Promise.resolve(null),
      ]);

      let fotos: Awaited<
        ReturnType<typeof mapRecebimentoDetalhe>
      >['fotos'] = [];
      let fotoTotalInformado = checklist?.photoCount ?? 0;

      let fotosAvaria: Awaited<
        ReturnType<typeof mapRecebimentoDetalhe>
      >['fotosAvaria'] = [];
      let avariasApi: Awaited<ReturnType<typeof listAvarias>> = [];

      if (recebimentoAtivo) {
        const [documentosChecklist, documentosAvaria, avarias] =
          await Promise.all([
            listChecklistDocumentos(recebimentoAtivo.id),
            listAvariaDocumentos(recebimentoAtivo.id),
            listAvarias(recebimentoAtivo.id),
          ]);

        avariasApi = avarias;

        const sorted = [...documentosChecklist].sort((a, b) =>
          compareChecklistPhotos(a.nome, b.nome),
        );

        fotos = await Promise.all(
          sorted.map(async (documento) => ({
            id: documento.id,
            legenda: resolveChecklistPhotoLabel(documento.nome),
            url: await getDocumentDownloadUrl(documento.id),
          })),
        );
        fotoTotalInformado = Math.max(
          fotoTotalInformado,
          fotos.length,
        );

        const fotosPorDocumento = new Map(
          await Promise.all(
            documentosAvaria.map(async (documento, index) => {
              const foto = {
                id: documento.id,
                legenda: `Evidência ${index + 1}`,
                url: await getDocumentDownloadUrl(documento.id),
              };
              return [documento.id, foto] as const;
            }),
          ),
        );

        fotosAvaria = [...fotosPorDocumento.values()];

        const fotosPorAvaria = alocarFotosPorAvaria(
          avarias,
          documentosAvaria,
          fotosPorDocumento,
        );

        const detalheBase = mapRecebimentoDetalhe({
          preRecebimento,
          recebimento: recebimentoAtivo,
          produtoMap,
          checklist,
          fotos,
          fotoTotalInformado,
        });

        setRecebimento({
          ...detalheBase,
          fotosAvaria,
          conferencia: enrichConferenciaComAvarias(
            detalheBase.conferencia,
            avarias,
            fotosPorAvaria,
          ),
        });
        return;
      }

      const detalheBase = mapRecebimentoDetalhe({
        preRecebimento,
        recebimento: recebimentoAtivo,
        produtoMap,
        checklist,
        fotos,
        fotoTotalInformado,
      });

      setRecebimento({
        ...detalheBase,
        fotosAvaria,
        conferencia: enrichConferenciaComAvarias(
          detalheBase.conferencia,
          avariasApi,
          new Map(),
        ),
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar o recebimento';

      toast.error(message);
      setRecebimento(null);
    } finally {
      setIsLoading(false);
    }
  }, [recebimentoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const conferenciaLista = recebimento?.conferencia ?? [];

  const conferenciaTotalPaginas = Math.max(
    1,
    Math.ceil(conferenciaLista.length / CONFERENCIA_PAGE_SIZE),
  );

  useEffect(() => {
    setPaginaConferenciaState(1);
  }, [recebimentoId]);

  useEffect(() => {
    setPaginaConferenciaState((prev) =>
      Math.min(prev, conferenciaTotalPaginas),
    );
  }, [conferenciaTotalPaginas]);

  const paginaConferenciaSegura = Math.min(
    paginaConferencia,
    conferenciaTotalPaginas,
  );

  const conferenciaItemsInicio =
    (paginaConferenciaSegura - 1) * CONFERENCIA_PAGE_SIZE;

  const conferenciaItensPagina = conferenciaLista.slice(
    conferenciaItemsInicio,
    conferenciaItemsInicio + CONFERENCIA_PAGE_SIZE,
  );

  const setPaginaConferencia = useCallback(
    (p: number) => {
      const alvo = Math.max(1, Math.min(p, conferenciaTotalPaginas));
      setPaginaConferenciaState(alvo);
    },
    [conferenciaTotalPaginas],
  );

  const voltar = useCallback(() => {
    router.push('/recebimento');
  }, [router]);

  const openLiberarConferencia = useCallback(() => {
    setIsLiberarOpen(true);
  }, []);

  const closeLiberarConferencia = useCallback(() => {
    if (!isSubmitting) {
      setIsLiberarOpen(false);
    }
  }, [isSubmitting]);

  const openRecepcionar = useCallback(() => {
    setIsRecepcionarOpen(true);
  }, []);

  const closeRecepcionar = useCallback(() => {
    if (!isSubmitting) {
      setIsRecepcionarOpen(false);
    }
  }, [isSubmitting]);

  const confirmarRecepcionarCarro = useCallback(
    async (payload: RecepcionarCarroPayload) => {
      if (!recebimento) {
        return;
      }

      setIsSubmitting(true);

      try {
        await recepcionarCarro(recebimento.id, payload);
        setIsRecepcionarOpen(false);
        toast.success('Veículo recepcionado', {
          description: payload.placa ?? recebimento.placa,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível recepcionar o veículo';

        toast.error(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, recebimento],
  );

  const confirmarLiberarConferencia = useCallback(
    async (docaId: string) => {
      if (!recebimento) {
        return;
      }

      setIsSubmitting(true);

      try {
        await liberarConferencia(recebimento.id, { docaId });
        setIsLiberarOpen(false);
        toast.success('Carga liberada para conferência', {
          description: recebimento.placa,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível liberar para conferência';

        toast.error(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, recebimento],
  );

  const openFinalizar = useCallback(() => {
    setIsFinalizarOpen(true);
  }, []);

  const closeFinalizar = useCallback(() => {
    if (!isSubmitting) {
      setIsFinalizarOpen(false);
    }
  }, [isSubmitting]);

  const reimprimirEtiquetas = useCallback(async () => {
    const recebimentoAtivoId = recebimento?.recebimentoId;

    if (!recebimento || !recebimentoAtivoId) {
      toast.error('Recebimento ainda não foi conferido no PWA');
      return;
    }

    if (
      recebimento.modoUnitizacao !== 'gerar_etiqueta_na_armazenagem' &&
      recebimento.temPaletesBipados
    ) {
      toast.error('Este recebimento não possui etiquetas de palete');
      return;
    }

    setIsSubmitting(true);

    try {
      await reimprimirEtiquetasRecebimento(recebimentoAtivoId);
      toast.success('PDF das etiquetas baixado', {
        description: recebimento.numero,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível baixar o PDF das etiquetas';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [recebimento]);

  const openExcluir = useCallback(() => {
    setIsExcluirOpen(true);
  }, []);

  const openLinkRastreio = useCallback(() => {
    setIsLinkRastreioOpen(true);
  }, []);

  const closeLinkRastreio = useCallback(() => {
    setIsLinkRastreioOpen(false);
  }, []);

  const openImportOffline = useCallback(() => {
    setIsImportOfflineOpen(true);
  }, []);

  const closeImportOffline = useCallback(() => {
    setIsImportOfflineOpen(false);
  }, []);

  const closeExcluir = useCallback(() => {
    if (!isSubmitting) {
      setIsExcluirOpen(false);
    }
  }, [isSubmitting]);

  const confirmarExcluir = useCallback(async () => {
    if (!recebimento) {
      return;
    }

    setIsSubmitting(true);

    try {
      await cancelPreRecebimento(recebimento.id);
      setIsExcluirOpen(false);
      toast.success('Pré-recebimento cancelado', {
        description: recebimento.placa,
      });
      router.push('/recebimento');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível cancelar o pré-recebimento';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [recebimento, router]);

  const confirmarFinalizar = useCallback(
    async (_liberarPortaria: boolean, detalhe?: RecebimentoDetalhe) => {
      const alvo = detalhe ?? recebimento;
      const recebimentoAtivoId = alvo?.recebimentoId;

      if (!alvo || !recebimentoAtivoId) {
        toast.error('Recebimento ainda não foi conferido no PWA');
        return;
      }

      if (alvo.status !== 'conferido') {
        toast.error('Finalização só é permitida após conferência encerrada');
        return;
      }

      setIsSubmitting(true);

      try {
        await finalizarRecebimento(recebimentoAtivoId);
        setIsFinalizarOpen(false);
        toast.success('Recebimento finalizado', {
          description: alvo.numero,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível finalizar o recebimento';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, recebimento],
  );

  const reabrirDemanda = useCallback(async () => {
    const recebimentoAtivoId = recebimento?.recebimentoId;

    if (!recebimento || !recebimentoAtivoId) {
      toast.error('Recebimento ainda não foi conferido no PWA');
      return false;
    }

    if (recebimento.status !== 'conferido') {
      toast.error('Só é possível reabrir demandas com status Conferido.');
      return false;
    }

    setIsSubmitting(true);

    try {
      await reabrirConferencia(recebimentoAtivoId);
      toast.success('Demanda reaberta para conferência', {
        description: recebimento.placa,
      });
      await carregar();
      return true;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível reabrir a demanda';

      toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [carregar, recebimento]);

  return {
    isLoading,
    isSubmitting,
    recebimento,
    conferenciaPagina: paginaConferenciaSegura,
    conferenciaTotalPaginas,
    conferenciaItensPagina,
    conferenciaItemsInicio,
    conferenciaTotalItens: conferenciaLista.length,
    conferenciaPageSize: CONFERENCIA_PAGE_SIZE,
    setPaginaConferencia,
    voltar,
    isLiberarOpen,
    openLiberarConferencia,
    closeLiberarConferencia,
    confirmarLiberarConferencia,
    isRecepcionarOpen,
    openRecepcionar,
    closeRecepcionar,
    confirmarRecepcionarCarro,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    reimprimirEtiquetas,
    reabrirDemanda,
    isExcluirOpen,
    openExcluir,
    closeExcluir,
    confirmarExcluir,
    isLinkRastreioOpen,
    openLinkRastreio,
    closeLinkRastreio,
    isImportOfflineOpen,
    openImportOffline,
    closeImportOffline,
    recarregar: carregar,
  };
}
