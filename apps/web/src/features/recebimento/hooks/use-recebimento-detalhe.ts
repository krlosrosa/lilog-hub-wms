'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { listDocas, mapDocaToListaItem } from '@/features/docas/lib/docas-api';
import { listFuncionarios } from '@/features/funcionarios/lib/funcionario-api';
import { listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '@/features/recebimento/lib/checklist-photo-label';
import {
  aprovarRecebimento,
  checkinVeiculo,
  encerrarConferencia,
  fetchChecklist,
  finalizarRecebimento,
  getDocumentDownloadUrl,
  getPreRecebimento,
  getRecebimentoByPreRecebimento,
  iniciarRecebimento,
  listAvariaDocumentos,
  listAvarias,
  listChecklistDocumentos,
} from '@/features/recebimento/lib/recebimento-api';
import {
  alocarFotosPorAvaria,
  enrichConferenciaComAvarias,
} from '@/features/recebimento/lib/enrich-conferencia-avarias';
import { mapRecebimentoDetalhe } from '@/features/recebimento/lib/map-recebimento-detalhe';
import type { DocaItem } from '@/features/recebimento/types/recebimento-lista.schema';
import type { RecebimentoDetalhe } from '@/features/recebimento/types/recebimento-detalhe.schema';
import { ApiClientError } from '@/lib/api';

const CONFERENCIA_PAGE_SIZE = 4;

type DocaComReferencia = DocaItem & { id: string };

function mapDocaListaToDocaComReferencia(
  doca: ReturnType<typeof mapDocaToListaItem>,
): DocaComReferencia {
  const numero =
    Number.parseInt(doca.codigo.replace(/\D/g, ''), 10) ||
    Number.parseInt(doca.codigo, 10) ||
    1;

  const status =
    doca.situacao === 'manutencao'
      ? 'manutencao'
      : doca.situacao === 'ocupada'
        ? 'ocupada'
        : 'disponivel';

  return {
    id: doca.id,
    numero,
    status,
    capacidadeToneladas: doca.capacidadeVeiculos ?? undefined,
    etiquetaManutencao: doca.situacao === 'manutencao' ? 'MANUT' : undefined,
  };
}

async function buildProdutoMap(
  produtoIds: string[],
): Promise<Map<string, ProdutoApi>> {
  if (!produtoIds.length) {
    return new Map();
  }

  const response = await listProdutos({ limit: 100 });
  const map = new Map<string, ProdutoApi>();

  for (const produto of response.items) {
    if (produtoIds.includes(produto.id)) {
      map.set(produto.id, produto);
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
  const [isAlocarDocaOpen, setIsAlocarDocaOpen] = useState(false);
  const [isFinalizarOpen, setIsFinalizarOpen] = useState(false);
  const [docas, setDocas] = useState<DocaComReferencia[]>([]);

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

      const [produtoMap, docasResponse, checklist] = await Promise.all([
        buildProdutoMap([...new Set(produtoIds)]),
        listDocas({
          page: 1,
          limit: 50,
          unidadeId: preRecebimento.unidadeId,
        }),
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

        setDocas(
          docasResponse.items
            .map(mapDocaToListaItem)
            .map(mapDocaListaToDocaComReferencia),
        );
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

      setDocas(
        docasResponse.items
          .map(mapDocaToListaItem)
          .map(mapDocaListaToDocaComReferencia),
      );
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

  const openAlocarDoca = useCallback(() => {
    setIsAlocarDocaOpen(true);
  }, []);

  const closeAlocarDoca = useCallback(() => {
    if (!isSubmitting) {
      setIsAlocarDocaOpen(false);
    }
  }, [isSubmitting]);

  const confirmarAlocarDoca = useCallback(
    async (docaNumero: number) => {
      if (!recebimento) {
        return;
      }

      const doca = docas.find((item) => item.numero === docaNumero);

      if (!doca) {
        toast.error('Doca selecionada não encontrada');
        return;
      }

      setIsSubmitting(true);

      try {
        let situacaoAtual = recebimento.preRecebimentoSituacao;

        if (situacaoAtual === 'agendado') {
          const checkin = await checkinVeiculo(recebimento.id);
          situacaoAtual = checkin.situacao;
        }

        if (situacaoAtual !== 'veiculo_chegou' && !recebimento.recebimentoId) {
          throw new Error(
            'Veículo precisa estar com check-in realizado antes de alocar doca',
          );
        }

        if (!recebimento.recebimentoId) {
          const funcionarios = await listFuncionarios({
            unidadeId: recebimento.unidade,
            situacao: 'ativo',
            limit: 20,
          });

          const responsavel =
            funcionarios.items.find((item) => item.cargo === 'recebedor') ??
            funcionarios.items[0];

          if (!responsavel) {
            throw new Error(
              'Nenhum funcionário ativo encontrado para responsável do recebimento',
            );
          }

          await iniciarRecebimento({
            preRecebimentoId: recebimento.id,
            docaId: doca.id,
            responsavelId: responsavel.id,
          });
        }

        setIsAlocarDocaOpen(false);
        toast.success(`Doca ${String(docaNumero).padStart(2, '0')} alocada`, {
          description: `Veículo ${recebimento.placa} direcionado para descarga.`,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível alocar a doca';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, docas, recebimento],
  );

  const executarFinalizacao = useCallback(
    async (recebimentoAtivoId: string, situacaoAtual?: string | null) => {
      if (situacaoAtual === 'em_recebimento') {
        await encerrarConferencia(recebimentoAtivoId);
        await aprovarRecebimento(recebimentoAtivoId);
      } else if (situacaoAtual === 'aguardando_aprovacao') {
        await aprovarRecebimento(recebimentoAtivoId);
      }

      await finalizarRecebimento(recebimentoAtivoId);
    },
    [],
  );

  const liberarArmazem = useCallback(
    async (detalhe?: RecebimentoDetalhe) => {
      const alvo = detalhe ?? recebimento;
      const recebimentoAtivoId = alvo?.recebimentoId;

      if (!alvo || !recebimentoAtivoId) {
        toast.error('Inicie o recebimento antes de liberar para o armazém');
        return;
      }

      setIsSubmitting(true);

      try {
        await executarFinalizacao(
          recebimentoAtivoId,
          alvo.recebimentoSituacao,
        );
        toast.success('Recebimento liberado para armazenagem', {
          description: alvo.numero,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível liberar para o armazém';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, executarFinalizacao, recebimento],
  );

  const openFinalizar = useCallback(() => {
    setIsFinalizarOpen(true);
  }, []);

  const closeFinalizar = useCallback(() => {
    if (!isSubmitting) {
      setIsFinalizarOpen(false);
    }
  }, [isSubmitting]);

  const confirmarFinalizar = useCallback(
    async (_liberarPortaria: boolean, detalhe?: RecebimentoDetalhe) => {
      const alvo = detalhe ?? recebimento;
      const recebimentoAtivoId = alvo?.recebimentoId;

      if (!alvo || !recebimentoAtivoId) {
        toast.error('Inicie o recebimento antes de finalizar o processo');
        return;
      }

      setIsSubmitting(true);

      try {
        await executarFinalizacao(
          recebimentoAtivoId,
          alvo.recebimentoSituacao,
        );
        setIsFinalizarOpen(false);
        toast.success('Recebimento finalizado', {
          description: alvo.numero,
        });
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível finalizar o recebimento';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar, executarFinalizacao, recebimento],
  );

  const docasParaModal = useMemo<readonly DocaItem[]>(
    () => docas.map(({ id: _id, ...doca }) => doca),
    [docas],
  );

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
    docas: docasParaModal,
    isAlocarDocaOpen,
    openAlocarDoca,
    closeAlocarDoca,
    confirmarAlocarDoca,
    liberarArmazem,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    recarregar: carregar,
  };
}
