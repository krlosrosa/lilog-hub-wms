'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';

import {
  formatCentroLabel,
  listCentros,
  listEnderecos,
} from '@/features/enderecos/lib/endereco-api';
import type { CentroOptionApi } from '@/features/enderecos/types/endereco.api';
import {
  createProdutoEndereco,
  deleteProdutoEndereco,
  listProdutoEnderecos,
  updateProdutoEndereco,
} from '@/features/produto-endereco/lib/produto-endereco-api';
import type { ProdutoEnderecoApi } from '@/features/produto-endereco/types/produto-endereco.api';
import {
  buildSlottingDraft,
  resolverDraftNovaAlocacao,
  slottingDraftsEqual,
  type ProdutoEnderecoPapelForm,
  type SlottingEnderecoLinha,
  type SlottingLinhaDraft,
} from '@/features/produto-endereco/types/produto-endereco.schema';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 25;
const ALOCACOES_PAGE_SIZE = 100;

async function listarAlocacoesDoCentro(
  centroId: string,
  unidadeId: string,
): Promise<ProdutoEnderecoApi[]> {
  const items: ProdutoEnderecoApi[] = [];
  let page = 1;
  let total = 0;

  do {
    const response = await listProdutoEnderecos({
      centroId,
      unidadeId,
      page,
      limit: ALOCACOES_PAGE_SIZE,
    });

    items.push(...response.items);
    total = response.total;
    page += 1;

    if (response.items.length === 0) {
      break;
    }
  } while (items.length < total);

  return items;
}

type FiltroTipoEndereco = 'todos' | 'picking' | 'pulmao';
type FiltroSlotting = 'todos' | 'com_produto' | 'sem_produto';

function escolherAlocacaoPrincipal(
  alocacoes: ProdutoEnderecoApi[],
): ProdutoEnderecoApi | undefined {
  if (alocacoes.length === 0) return undefined;

  const ativas = alocacoes.filter((item) => item.ativo);
  const pool = ativas.length > 0 ? ativas : alocacoes;

  const primaria = pool.find((item) => item.papel === 'picking_primario');
  if (primaria) return primaria;

  return [...pool].sort((a, b) => a.ordem - b.ordem)[0];
}

export function useProdutoEnderecosGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [centros, setCentros] = useState<CentroOptionApi[]>([]);
  const [centroId, setCentroId] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<FiltroTipoEndereco>('todos');
  const [slottingFiltro, setSlottingFiltro] = useState<FiltroSlotting>('todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalEnderecos, setTotalEnderecos] = useState(0);

  const [enderecos, setEnderecos] = useState<
    {
      id: string;
      enderecoMascarado: string;
      zona: string;
      rua: string;
      tipo: string;
    }[]
  >([]);

  const [drafts, setDrafts] = useState<Record<string, SlottingLinhaDraft>>({});
  const snapshotsRef = useRef<Record<string, SlottingLinhaDraft>>({});
  const alocacoesCentroRef = useRef<ProdutoEnderecoApi[]>([]);
  const [savingEnderecoIds, setSavingEnderecoIds] = useState<Set<string>>(
    new Set(),
  );

  const sincronizarAlocacaoRef = useCallback((alocacao: ProdutoEnderecoApi) => {
    alocacoesCentroRef.current = [
      ...alocacoesCentroRef.current.filter((item) => item.id !== alocacao.id),
      alocacao,
    ];
  }, []);

  const removerAlocacaoRef = useCallback((alocacaoId: string) => {
    alocacoesCentroRef.current = alocacoesCentroRef.current.filter(
      (item) => item.id !== alocacaoId,
    );
  }, []);

  useEffect(() => {
    if (!unidadeId) return;

    void listCentros(unidadeId)
      .then((response) => {
        setCentros(response);
        setCentroId((prev) => prev || response[0]?.id || '');
      })
      .catch(() => toast.error('Não foi possível carregar os centros'));
  }, [unidadeId]);

  const carregarDados = useCallback(async () => {
    if (!unidadeId || !centroId) {
      setEnderecos([]);
      setDrafts({});
      snapshotsRef.current = {};
      alocacoesCentroRef.current = [];
      setTotalEnderecos(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const enderecosResponse = await listEnderecos({
        page: pagina,
        limit: PAGE_SIZE,
        centroId,
        unidadeId,
        tipo: tipoFiltro === 'todos' ? undefined : tipoFiltro,
        search: busca,
      });

      let alocacoes: ProdutoEnderecoApi[] = [];

      try {
        alocacoes = await listarAlocacoesDoCentro(centroId, unidadeId);
      } catch {
        toast.error('Não foi possível carregar as alocações existentes');
      }

      alocacoesCentroRef.current = alocacoes;

      const mapa = new Map<string, ProdutoEnderecoApi[]>();
      for (const alocacao of alocacoes) {
        const lista = mapa.get(alocacao.enderecoId) ?? [];
        lista.push(alocacao);
        mapa.set(alocacao.enderecoId, lista);
      }

      const novosDrafts: Record<string, SlottingLinhaDraft> = {};
      const novosSnapshots: Record<string, SlottingLinhaDraft> = {};

      for (const endereco of enderecosResponse.items) {
        const alocacao = escolherAlocacaoPrincipal(
          mapa.get(endereco.id) ?? [],
        );
        const draft = buildSlottingDraft(alocacao, endereco.tipo);
        novosDrafts[endereco.id] = draft;
        novosSnapshots[endereco.id] = { ...draft };
      }

      setEnderecos(
        enderecosResponse.items.map((item) => ({
          id: item.id,
          enderecoMascarado: item.enderecoMascarado,
          zona: item.zona,
          rua: item.rua,
          tipo: item.tipo,
        })),
      );
      setDrafts(novosDrafts);
      snapshotsRef.current = novosSnapshots;
      setTotalEnderecos(enderecosResponse.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os endereços';
      toast.error(message);
      setEnderecos([]);
      setDrafts({});
      snapshotsRef.current = {};
      alocacoesCentroRef.current = [];
      setTotalEnderecos(0);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, centroId, pagina, tipoFiltro, busca]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(totalEnderecos / PAGE_SIZE)),
    [totalEnderecos],
  );

  const linhas = useMemo((): SlottingEnderecoLinha[] => {
    return enderecos
      .filter((endereco) => {
        const draft = drafts[endereco.id];
        if (!draft) return false;

        if (slottingFiltro === 'com_produto') return Boolean(draft.produtoId);
        if (slottingFiltro === 'sem_produto') return !draft.produtoId;
        return true;
      })
      .map((endereco) => {
        const draft = drafts[endereco.id] ?? buildSlottingDraft(undefined, endereco.tipo);
        const snapshot = snapshotsRef.current[endereco.id] ?? draft;

        return {
          enderecoId: endereco.id,
          enderecoMascarado: endereco.enderecoMascarado,
          zona: endereco.zona,
          rua: endereco.rua,
          tipo: endereco.tipo,
          draft,
          isDirty: !slottingDraftsEqual(draft, snapshot),
          isSaving: savingEnderecoIds.has(endereco.id),
        };
      });
  }, [enderecos, drafts, slottingFiltro, savingEnderecoIds]);

  const persistirLinha = useCallback(
    async (enderecoId: string, draft: SlottingLinhaDraft) => {
      if (!centroId) return;

      const snapshot = snapshotsRef.current[enderecoId];
      if (snapshot && slottingDraftsEqual(draft, snapshot)) return;

      const enderecoTipo =
        enderecos.find((item) => item.id === enderecoId)?.tipo ?? 'picking';

      const alocacoesResumo = alocacoesCentroRef.current.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        ordem: item.ordem,
        papel: item.papel,
      }));

      setSavingEnderecoIds((prev) => new Set(prev).add(enderecoId));

      try {
        if (!draft.produtoId) {
          if (snapshot?.alocacaoId) {
            await deleteProdutoEndereco(snapshot.alocacaoId);
            removerAlocacaoRef(snapshot.alocacaoId);
          }

          const limpo = buildSlottingDraft(undefined, enderecoTipo);
          snapshotsRef.current[enderecoId] = { ...limpo };
          setDrafts((prev) => ({ ...prev, [enderecoId]: limpo }));
          return;
        }

        const isNovaAlocacao =
          !snapshot?.alocacaoId || snapshot.produtoId !== draft.produtoId;

        const draftSalvar = isNovaAlocacao
          ? resolverDraftNovaAlocacao(
              draft,
              enderecoTipo,
              alocacoesResumo,
              snapshot?.alocacaoId,
            )
          : draft;

        if (!snapshot?.alocacaoId) {
          const criado = await createProdutoEndereco({
            centroId,
            produtoId: draftSalvar.produtoId!,
            enderecoId,
            papel: draftSalvar.papel,
            ordem: draftSalvar.ordem,
            ativo: draftSalvar.ativo,
          });

          sincronizarAlocacaoRef(criado);
          const atualizado = buildSlottingDraft(criado, criado.endereco.tipo);
          snapshotsRef.current[enderecoId] = { ...atualizado };
          setDrafts((prev) => ({ ...prev, [enderecoId]: atualizado }));
          return;
        }

        const produtoMudou = snapshot.produtoId !== draft.produtoId;

        if (produtoMudou) {
          await deleteProdutoEndereco(snapshot.alocacaoId);
          removerAlocacaoRef(snapshot.alocacaoId);

          const criado = await createProdutoEndereco({
            centroId,
            produtoId: draftSalvar.produtoId!,
            enderecoId,
            papel: draftSalvar.papel,
            ordem: draftSalvar.ordem,
            ativo: draftSalvar.ativo,
          });

          sincronizarAlocacaoRef(criado);
          const atualizado = buildSlottingDraft(criado, criado.endereco.tipo);
          snapshotsRef.current[enderecoId] = { ...atualizado };
          setDrafts((prev) => ({ ...prev, [enderecoId]: atualizado }));
          return;
        }

        const atualizadoApi = await updateProdutoEndereco(snapshot.alocacaoId, {
          papel: draftSalvar.papel,
          ordem: draftSalvar.ordem,
          ativo: draftSalvar.ativo,
        });

        sincronizarAlocacaoRef(atualizadoApi);
        const atualizado = buildSlottingDraft(
          atualizadoApi,
          atualizadoApi.endereco.tipo,
        );
        snapshotsRef.current[enderecoId] = { ...atualizado };
        setDrafts((prev) => ({ ...prev, [enderecoId]: atualizado }));
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível salvar a alocação';
        toast.error(message);

        if (snapshot) {
          setDrafts((prev) => ({ ...prev, [enderecoId]: { ...snapshot } }));
        }
      } finally {
        setSavingEnderecoIds((prev) => {
          const next = new Set(prev);
          next.delete(enderecoId);
          return next;
        });
      }
    },
    [centroId, enderecos, removerAlocacaoRef, sincronizarAlocacaoRef],
  );

  const atualizarDraft = useCallback(
    (enderecoId: string, patch: Partial<SlottingLinhaDraft>, salvar = true) => {
      setDrafts((prev) => {
        const atual = prev[enderecoId];
        if (!atual) return prev;

        const next = { ...atual, ...patch };
        const updated = { ...prev, [enderecoId]: next };

        if (salvar) {
          void persistirLinha(enderecoId, next);
        }

        return updated;
      });
    },
    [persistirLinha],
  );

  const selecionarProduto = useCallback(
    (enderecoId: string, produto: ProdutoApi) => {
      const enderecoTipo =
        enderecos.find((item) => item.id === enderecoId)?.tipo ?? 'picking';
      const snapshot = snapshotsRef.current[enderecoId];
      const alocacoesResumo = alocacoesCentroRef.current.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        ordem: item.ordem,
        papel: item.papel,
      }));

      const draftBase: SlottingLinhaDraft = {
        ...(drafts[enderecoId] ??
          buildSlottingDraft(undefined, enderecoTipo)),
        produtoId: produto.id,
        produtoSku: produto.sku,
        produtoDescricao: produto.descricao,
      };

      const draftResolvido = resolverDraftNovaAlocacao(
        draftBase,
        enderecoTipo,
        alocacoesResumo,
        snapshot?.alocacaoId,
      );

      setDrafts((prev) => ({ ...prev, [enderecoId]: draftResolvido }));
      void persistirLinha(enderecoId, draftResolvido);
    },
    [enderecos, drafts, persistirLinha],
  );

  const limparProduto = useCallback(
    (enderecoId: string) => {
      const endereco = enderecos.find((item) => item.id === enderecoId);
      const limpo = buildSlottingDraft(undefined, endereco?.tipo ?? 'picking');
      setDrafts((prev) => ({ ...prev, [enderecoId]: limpo }));
      void persistirLinha(enderecoId, limpo);
    },
    [enderecos, persistirLinha],
  );

  const alterarPapel = useCallback(
    (enderecoId: string, papel: ProdutoEnderecoPapelForm) => {
      atualizarDraft(enderecoId, { papel });
    },
    [atualizarDraft],
  );

  const alterarOrdem = useCallback(
    (enderecoId: string, ordem: number) => {
      atualizarDraft(enderecoId, { ordem }, false);
    },
    [atualizarDraft],
  );

  const confirmarOrdem = useCallback(
    (enderecoId: string) => {
      const draft = drafts[enderecoId];
      if (!draft?.produtoId) return;
      void persistirLinha(enderecoId, draft);
    },
    [drafts, persistirLinha],
  );

  const alterarAtivo = useCallback(
    (enderecoId: string, ativo: boolean) => {
      atualizarDraft(enderecoId, { ativo });
    },
    [atualizarDraft],
  );

  return {
    unidadeId,
    isLoading,
    centros,
    centroId,
    setCentroId: (value: string) => {
      setCentroId(value);
      setPagina(1);
    },
    tipoFiltro,
    setTipoFiltro: (value: FiltroTipoEndereco) => {
      setTipoFiltro(value);
      setPagina(1);
    },
    slottingFiltro,
    setSlottingFiltro: (value: FiltroSlotting) => {
      setSlottingFiltro(value);
    },
    busca,
    setBusca: (value: string) => {
      setBusca(value);
      setPagina(1);
    },
    pagina,
    setPagina,
    totalPaginas,
    total: totalEnderecos,
    pageSize: PAGE_SIZE,
    linhas,
    selecionarProduto,
    limparProduto,
    alterarPapel,
    alterarOrdem,
    confirmarOrdem,
    alterarAtivo,
    recarregar: carregarDados,
    formatCentroLabel,
  };
}

export type { FiltroTipoEndereco, FiltroSlotting };
