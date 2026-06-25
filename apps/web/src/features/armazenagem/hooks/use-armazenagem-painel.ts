'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

import { enrichItemArmazenagem } from '../lib/enrich-item-armazenagem';
import {
  definirEnderecoSugeridoItemArmazenagem,
  getDemandaArmazenagem,
  listDemandasArmazenagem,
  listEnderecosDisponiveisArmazenagem,
} from '../lib/armazenagem-api';
import type {
  DemandaArmazenagemStatusApi,
  ItemArmazenagemView,
} from '../types/armazenagem.api';

export type ItemArmazenagemPainelRow = ItemArmazenagemView & {
  demandaStatus: DemandaArmazenagemStatusApi;
  recebimentoId: string;
};

export type ArmazenagemPainelVisao = 'pendentes' | 'armazenados';

const DEMANDAS_ATIVAS_LIMIT = 100;
const DEMANDAS_CONCLUIDAS_LIMIT = 100;
const PAGE_SIZE = 25;

function isDemandaAtiva(status: DemandaArmazenagemStatusApi) {
  return status !== 'concluida' && status !== 'cancelada';
}

function isItemPendente(item: ItemArmazenagemPainelRow) {
  return (
    isDemandaAtiva(item.demandaStatus) && item.status !== 'armazenado'
  );
}

function isItemArmazenado(item: ItemArmazenagemPainelRow) {
  return item.demandaStatus === 'concluida' || item.status === 'armazenado';
}

export function useArmazenagemPainel() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);
  const [itens, setItens] = useState<ItemArmazenagemPainelRow[]>([]);
  const [visao, setVisaoState] = useState<ArmazenagemPainelVisao>('pendentes');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itemSelecionado, setItemSelecionado] =
    useState<ItemArmazenagemPainelRow | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setItens([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [ativasRes, concluidasRes] = await Promise.all([
        listDemandasArmazenagem({
          unidadeId,
          page: 1,
          limit: DEMANDAS_ATIVAS_LIMIT,
        }),
        listDemandasArmazenagem({
          unidadeId,
          page: 1,
          limit: DEMANDAS_CONCLUIDAS_LIMIT,
          status: 'concluida',
        }),
      ]);

      const demandasAtivas = ativasRes.items.filter((demanda) =>
        isDemandaAtiva(demanda.status),
      );
      const demandasConcluidas = concluidasRes.items.filter(
        (demanda) => demanda.status === 'concluida',
      );

      const demandasPorId = new Map(
        [...demandasAtivas, ...demandasConcluidas].map((demanda) => [
          demanda.id,
          demanda,
        ]),
      );

      const detalhes = await Promise.all(
        [...demandasPorId.values()].map((demanda) =>
          getDemandaArmazenagem(demanda.id),
        ),
      );

      const itensBrutos = detalhes.flatMap((demanda) =>
        demanda.itens.map((item) => ({
          ...item,
          demandaStatus: demanda.status,
          recebimentoId: demanda.recebimentoId,
        })),
      );

      const itensEnriquecidos: ItemArmazenagemPainelRow[] = await Promise.all(
        itensBrutos.map(async (item) => {
          const enriched = await enrichItemArmazenagem(item);

          return {
            ...enriched,
            demandaStatus: item.demandaStatus,
            recebimentoId: item.recebimentoId,
          };
        }),
      );

      setItens(itensEnriquecidos);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as demandas de armazenagem';
      toast.error(message);
      setItens([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const itensPorVisao = useMemo(
    () => ({
      pendentes: itens.filter(isItemPendente),
      armazenados: itens.filter(isItemArmazenado),
    }),
    [itens],
  );

  const itensFiltrados = useMemo(() => {
    const base = itensPorVisao[visao];
    const term = busca.trim().toLowerCase();
    if (!term) return base;

    return base.filter(
      (item) =>
        item.demandaId.toLowerCase().includes(term) ||
        item.recebimentoId.toLowerCase().includes(term) ||
        item.produtoSku?.toLowerCase().includes(term) ||
        item.produtoNome?.toLowerCase().includes(term) ||
        item.enderecoSugeridoLabel?.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term),
    );
  }, [busca, itensPorVisao, visao]);

  const total = itensFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;
  const itensPagina = itensFiltrados.slice(
    itemsInicio - 1,
    itemsInicio - 1 + PAGE_SIZE,
  );

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setVisao = useCallback((value: ArmazenagemPainelVisao) => {
    setVisaoState(value);
    setPagina(1);
  }, []);

  const resumo = useMemo(() => {
    const pendentes = itensPorVisao.pendentes;
    const armazenados = itensPorVisao.armazenados;

    const pendentesEndereco = pendentes.filter(
      (item) => !item.enderecoSugeridoId,
    ).length;

    return {
      pendentes: pendentes.length,
      armazenados: armazenados.length,
      comEndereco: pendentes.filter((item) => item.enderecoSugeridoId).length,
      pendentesEndereco,
    };
  }, [itensPorVisao]);

  const atualizarItem = useCallback((enriched: ItemArmazenagemPainelRow) => {
    setItens((prev) =>
      prev.map((item) => (item.id === enriched.id ? enriched : item)),
    );
  }, []);

  const abrirSelecaoEndereco = useCallback((item: ItemArmazenagemPainelRow) => {
    if (item.status === 'armazenado') {
      toast.info('Item já armazenado — endereço não pode ser alterado.');
      return;
    }

    if (
      item.demandaStatus === 'concluida' ||
      item.demandaStatus === 'cancelada'
    ) {
      toast.info('Demanda encerrada — endereço não pode ser alterado.');
      return;
    }

    setItemSelecionado(item);
  }, []);

  const fecharSelecaoEndereco = useCallback(() => {
    setItemSelecionado(null);
  }, []);

  const salvarEnderecoSugerido = useCallback(
    async (enderecoSugeridoId: string) => {
      if (!itemSelecionado) return;

      setIsSaving(true);

      try {
        const updated = await definirEnderecoSugeridoItemArmazenagem(
          itemSelecionado.demandaId,
          itemSelecionado.id,
          enderecoSugeridoId,
        );

        const enriched: ItemArmazenagemPainelRow = {
          ...(await enrichItemArmazenagem(updated as ItemArmazenagemView)),
          demandaStatus: itemSelecionado.demandaStatus,
          recebimentoId: itemSelecionado.recebimentoId,
        };

        atualizarItem(enriched);

        toast.success('Endereço de armazenagem definido', {
          description:
            enriched.enderecoSugeridoLabel ?? enriched.enderecoSugeridoId,
        });
        setItemSelecionado(null);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível salvar o endereço';
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [atualizarItem, itemSelecionado],
  );

  const buscarEnderecosDisponiveis = useCallback(
    async (search: string, page = 1) => {
      if (!itemSelecionado) {
        return { items: [], total: 0, page: 1, limit: 20 };
      }

      return listEnderecosDisponiveisArmazenagem(
        itemSelecionado.demandaId,
        itemSelecionado.id,
        { search, page, limit: 20 },
      );
    },
    [itemSelecionado],
  );

  const alocarAutomaticamente = useCallback(async () => {
    const candidatos = itensPorVisao.pendentes.filter(
      (item) => !item.enderecoSugeridoId,
    );

    if (candidatos.length === 0) {
      toast.info('Todos os itens já possuem endereço definido.');
      return;
    }

    setIsAutoAllocating(true);

    const enderecosUsados = new Set(
      itens
        .map((item) => item.enderecoSugeridoId)
        .filter((id): id is string => Boolean(id)),
    );

    let alocados = 0;
    let falhas = 0;

    try {
      for (const item of candidatos) {
        try {
          const response = await listEnderecosDisponiveisArmazenagem(
            item.demandaId,
            item.id,
            { page: 1, limit: 20 },
          );

          const endereco = response.items.find(
            (entry) => !enderecosUsados.has(entry.id),
          );

          if (!endereco) {
            falhas += 1;
            continue;
          }

          const updated = await definirEnderecoSugeridoItemArmazenagem(
            item.demandaId,
            item.id,
            endereco.id,
          );

          const enriched: ItemArmazenagemPainelRow = {
            ...(await enrichItemArmazenagem(updated as ItemArmazenagemView)),
            demandaStatus: item.demandaStatus,
            recebimentoId: item.recebimentoId,
          };

          enderecosUsados.add(endereco.id);
          atualizarItem(enriched);
          alocados += 1;
        } catch {
          falhas += 1;
        }
      }

      if (alocados > 0) {
        toast.success(
          `${alocados} ${alocados === 1 ? 'item alocado' : 'itens alocados'} automaticamente`,
        );
      }

      if (falhas > 0) {
        toast.warning(
          `${falhas} ${falhas === 1 ? 'item não pôde' : 'itens não puderam'} ser alocado${falhas === 1 ? '' : 's'} — endereços insuficientes`,
        );
      }
    } finally {
      setIsAutoAllocating(false);
    }
  }, [atualizarItem, itensPorVisao.pendentes]);

  return {
    unidadeId,
    isLoading,
    isSaving,
    isAutoAllocating,
    visao,
    setVisao,
    itensPagina,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    resumo,
    itemSelecionado,
    abrirSelecaoEndereco,
    fecharSelecaoEndereco,
    salvarEnderecoSugerido,
    buscarEnderecosDisponiveis,
    alocarAutomaticamente,
    recarregar: carregar,
  };
}
