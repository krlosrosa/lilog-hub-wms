'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

import { enrichItemArmazenagem } from '../lib/enrich-item-armazenagem';
import { flattenDemandaItens } from '../lib/flatten-demanda-itens';
import {
  definirEnderecoSugeridoItemArmazenagem,
  getDemandaArmazenagem,
  listDemandasArmazenagem,
  listEnderecosDisponiveisArmazenagem,
  validarDemandaArmazenagem,
} from '../lib/armazenagem-api';
import type {
  DemandaArmazenagemStatusApi,
  ItemArmazenagemView,
} from '../types/armazenagem.api';

export type ItemArmazenagemPainelRow = ItemArmazenagemView & {
  demandaStatus: DemandaArmazenagemStatusApi;
  recebimentoId: string;
};

export type ArmazenagemPainelVisao =
  | 'pendentes'
  | 'aguardando_validacao'
  | 'armazenados';

export type DemandaValidacaoGrupo = {
  demandaId: string;
  recebimentoId: string;
  itens: ItemArmazenagemPainelRow[];
  podeValidar: boolean;
};

const DEMANDAS_ATIVAS_LIMIT = 100;
const DEMANDAS_CONCLUIDAS_LIMIT = 100;
const PAGE_SIZE = 25;

function isDemandaAtiva(status: DemandaArmazenagemStatusApi) {
  return (
    status !== 'concluida' &&
    status !== 'cancelada' &&
    status !== 'aguardando_validacao'
  );
}

function isItemPendente(item: ItemArmazenagemPainelRow) {
  return isDemandaAtiva(item.demandaStatus) && item.status !== 'armazenado';
}

function isItemAguardandoValidacao(item: ItemArmazenagemPainelRow) {
  return item.demandaStatus === 'aguardando_validacao';
}

function isItemArmazenado(item: ItemArmazenagemPainelRow) {
  return item.demandaStatus === 'concluida' || item.status === 'armazenado';
}

export function useArmazenagemPainel() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>(null);
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
      const [ativasRes, validacaoRes, concluidasRes] = await Promise.all([
        listDemandasArmazenagem({
          unidadeId,
          page: 1,
          limit: DEMANDAS_ATIVAS_LIMIT,
        }),
        listDemandasArmazenagem({
          unidadeId,
          page: 1,
          limit: DEMANDAS_ATIVAS_LIMIT,
          status: 'aguardando_validacao',
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
      const demandasValidacao = validacaoRes.items.filter(
        (demanda) => demanda.status === 'aguardando_validacao',
      );
      const demandasConcluidas = concluidasRes.items.filter(
        (demanda) => demanda.status === 'concluida',
      );

      const demandasPorId = new Map(
        [...demandasAtivas, ...demandasValidacao, ...demandasConcluidas].map(
          (demanda) => [demanda.id, demanda],
        ),
      );

      const detalhes = await Promise.all(
        [...demandasPorId.values()].map((demanda) =>
          getDemandaArmazenagem(demanda.id),
        ),
      );

      const itensBrutos = detalhes.flatMap((demanda) =>
        flattenDemandaItens(demanda).map((item) => ({
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
      aguardando_validacao: itens.filter(isItemAguardandoValidacao),
      armazenados: itens.filter(isItemArmazenado),
    }),
    [itens],
  );

  const gruposValidacao = useMemo((): DemandaValidacaoGrupo[] => {
    const map = new Map<string, DemandaValidacaoGrupo>();

    for (const item of itensPorVisao.aguardando_validacao) {
      const existing = map.get(item.demandaId);

      if (!existing) {
        map.set(item.demandaId, {
          demandaId: item.demandaId,
          recebimentoId: item.recebimentoId,
          itens: [item],
          podeValidar: Boolean(item.enderecoSugeridoId),
        });
        continue;
      }

      existing.itens.push(item);
      existing.podeValidar =
        existing.podeValidar && Boolean(item.enderecoSugeridoId);
    }

    return [...map.values()];
  }, [itensPorVisao.aguardando_validacao]);

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
        item.unitizadorCodigo?.toLowerCase().includes(term) ||
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
    const aguardandoValidacao = itensPorVisao.aguardando_validacao;
    const armazenados = itensPorVisao.armazenados;

    const pendentesEndereco = pendentes.filter(
      (item) => !item.enderecoSugeridoId,
    ).length;

    const validacaoSemEndereco = aguardandoValidacao.filter(
      (item) => !item.enderecoSugeridoId,
    ).length;

    return {
      pendentes: pendentes.length,
      aguardandoValidacao: aguardandoValidacao.length,
      armazenados: armazenados.length,
      comEndereco: pendentes.filter((item) => item.enderecoSugeridoId).length,
      pendentesEndereco,
      validacaoSemEndereco,
      gruposValidacao: gruposValidacao.length,
    };
  }, [gruposValidacao.length, itensPorVisao]);

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

  const validarDemanda = useCallback(
    async (demandaId: string) => {
      setIsValidating(demandaId);

      try {
        await validarDemandaArmazenagem(demandaId);
        toast.success('Demanda validada — paletes liberados para movimentação');
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível validar a demanda';
        toast.error(message);
      } finally {
        setIsValidating(null);
      }
    },
    [carregar],
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
  }, [atualizarItem, itens, itensPorVisao.pendentes]);

  return {
    unidadeId,
    isLoading,
    isSaving,
    isValidating,
    isAutoAllocating,
    visao,
    setVisao,
    itensPagina,
    gruposValidacao,
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
    validarDemanda,
    alocarAutomaticamente,
    recarregar: carregar,
  };
}
