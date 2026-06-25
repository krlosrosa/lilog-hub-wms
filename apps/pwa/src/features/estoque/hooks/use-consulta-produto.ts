import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { hapticError, hapticLight, hapticMedium } from '@/lib/haptics';

import {
  CONSULTA_PRODUTO_SKUS,
  SEED_CONSULTA_PRODUTO,
} from '../data/consulta-produto-seed';
import type {
  FiltroTipoEstoque,
  Localizacao,
  PrioridadeRessuprimentoDraft,
  ProdutoResult,
  RessuprimentoSolicitacaoDraft,
  TipoEstoque,
} from '../types/consulta-produto.schema';

const SEARCH_DELAY_MS = 800;
const RESSUPRIMENTO_SUBMIT_MS = 600;
const PRIORIDADE_SUBMIT_MS = 500;

function gerarOrdemId(): string {
  const suffix = String(Date.now()).slice(-4);
  return `ORD-RESSUP-${suffix}`;
}

export type ConsultaProdutoFeedback = {
  variant: 'error' | 'success';
  message: string;
} | null;

function normalizeSku(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function lookupProduto(query: string): ProdutoResult | null {
  const normalized = normalizeSku(query);
  if (!normalized) return null;

  const direct = CONSULTA_PRODUTO_SKUS[normalized];
  if (direct) return direct;

  const nome = normalizeSku(SEED_CONSULTA_PRODUTO.nome);
  const categoria = normalizeSku(SEED_CONSULTA_PRODUTO.categoria);
  const sku = normalizeSku(SEED_CONSULTA_PRODUTO.sku);

  if (
    normalized.includes('7821') ||
    sku.includes(normalized) ||
    nome.includes(normalized) ||
    categoria.includes(normalized) ||
    normalized.includes('picanha') ||
    normalized.includes('premium')
  ) {
    return SEED_CONSULTA_PRODUTO;
  }

  return null;
}

function sumQuantidade(locais: Localizacao[]): number {
  return locais.reduce((acc, loc) => acc + loc.quantidade, 0);
}

function countByTipo(locais: Localizacao[], tipo: TipoEstoque): number {
  return locais.filter((loc) => loc.tipo === tipo).length;
}

export function useConsultaProduto() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resultado, setResultado] = useState<ProdutoResult | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoEstoque>('todos');
  const [feedback, setFeedback] = useState<ConsultaProdutoFeedback>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [ressuprimentoDraft, setRessuprimentoDraft] =
    useState<RessuprimentoSolicitacaoDraft | null>(null);
  const [ressuprimentoSheetOpen, setRessuprimentoSheetOpen] = useState(false);
  const [isSubmittingRessuprimento, setIsSubmittingRessuprimento] = useState(false);
  const [prioridadeDraft, setPrioridadeDraft] =
    useState<PrioridadeRessuprimentoDraft | null>(null);
  const [prioridadeSheetOpen, setPrioridadeSheetOpen] = useState(false);
  const [isSubmittingPrioridade, setIsSubmittingPrioridade] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ressuprimentoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prioridadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (next: ConsultaProdutoFeedback) => {
      clearFeedbackTimer();
      setFeedback(next);
      if (next) {
        feedbackTimerRef.current = setTimeout(() => {
          setFeedback(null);
          feedbackTimerRef.current = null;
        }, 3200);
      }
    },
    [clearFeedbackTimer],
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (ressuprimentoTimerRef.current) clearTimeout(ressuprimentoTimerRef.current);
      if (prioridadeTimerRef.current) clearTimeout(prioridadeTimerRef.current);
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer]);

  const handleSearch = useCallback(() => {
    const term = query.trim();
    if (!term) {
      hapticError();
      showFeedback({ variant: 'error', message: 'Informe o SKU ou escaneie o código' });
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    setIsSearching(true);
    setResultado(null);
    setFiltroTipo('todos');
    hapticMedium();

    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      const found = lookupProduto(term);
      setIsSearching(false);

      if (!found) {
        hapticError();
        showFeedback({ variant: 'error', message: 'Produto não encontrado para este SKU' });
        return;
      }

      hapticMedium();
      setResultado(found);
      showFeedback({ variant: 'success', message: `Produto localizado: ${found.nome}` });
    }, SEARCH_DELAY_MS);
  }, [query, showFeedback]);

  const handleSetFiltroTipo = useCallback((tipo: FiltroTipoEstoque) => {
    hapticLight();
    setFiltroTipo(tipo);
  }, []);

  const localizacoesFiltradas = useMemo(() => {
    if (!resultado) return [];
    if (filtroTipo === 'todos') return resultado.localizacoes;
    return resultado.localizacoes.filter((loc) => loc.tipo === filtroTipo);
  }, [resultado, filtroTipo]);

  const tipoCounts = useMemo(() => {
    const locais = resultado?.localizacoes ?? [];
    return {
      todos: locais.length,
      picking: countByTipo(locais, 'picking'),
      aereo: countByTipo(locais, 'aereo'),
    };
  }, [resultado]);

  const tipoQuantidades = useMemo(() => {
    const locais = resultado?.localizacoes ?? [];
    const picking = locais.filter((loc) => loc.tipo === 'picking');
    const aereo = locais.filter((loc) => loc.tipo === 'aereo');
    return {
      picking: sumQuantidade(picking),
      aereo: sumQuantidade(aereo),
    };
  }, [resultado]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResultado(null);
    setFiltroTipo('todos');
    setIsSearching(false);
    setFeedback(null);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  const handleScanResult = useCallback(
    (value: string) => {
      setQuery(value);
      setScannerOpen(false);
      hapticMedium();
    },
    [],
  );

  const openScanner = useCallback(() => {
    setScannerOpen(true);
    hapticMedium();
  }, []);

  const closeScanner = useCallback((open: boolean) => {
    setScannerOpen(open);
  }, []);

  const abrirSolicitarRessuprimento = useCallback(
    (localizacao: Localizacao) => {
      if (!resultado) return;
      if (localizacao.tipo !== 'picking' || localizacao.ordemRessuprimento) {
        hapticError();
        showFeedback({
          variant: 'error',
          message: 'Já existe ressuprimento em andamento neste endereço',
        });
        return;
      }

      hapticMedium();
      setRessuprimentoDraft({
        localizacaoId: localizacao.id,
        endereco: localizacao.endereco,
        produtoNome: resultado.nome,
        sku: resultado.sku,
        unidade: resultado.unidade,
        quantidadeAtual: localizacao.quantidade,
      });
      setRessuprimentoSheetOpen(true);
    },
    [resultado, showFeedback],
  );

  const handleRessuprimentoSheetOpenChange = useCallback((open: boolean) => {
    setRessuprimentoSheetOpen(open);
    if (!open) {
      setRessuprimentoDraft(null);
      setIsSubmittingRessuprimento(false);
      if (ressuprimentoTimerRef.current) {
        clearTimeout(ressuprimentoTimerRef.current);
        ressuprimentoTimerRef.current = null;
      }
    }
  }, []);

  const confirmarSolicitarRessuprimento = useCallback(() => {
    if (!resultado || !ressuprimentoDraft || isSubmittingRessuprimento) return;

    setIsSubmittingRessuprimento(true);
    hapticMedium();

    if (ressuprimentoTimerRef.current) clearTimeout(ressuprimentoTimerRef.current);

    ressuprimentoTimerRef.current = setTimeout(() => {
      ressuprimentoTimerRef.current = null;
      const { localizacaoId, endereco } = ressuprimentoDraft;
      const ordemId = gerarOrdemId();

      setResultado((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          localizacoes: prev.localizacoes.map((loc) =>
            loc.id === localizacaoId
              ? {
                  ...loc,
                  ordemRessuprimento: {
                    ordemId,
                    prioridadeSolicitada: false,
                  },
                }
              : loc,
          ),
        };
      });

      setIsSubmittingRessuprimento(false);
      setRessuprimentoSheetOpen(false);
      setRessuprimentoDraft(null);
      hapticMedium();
      showFeedback({
        variant: 'success',
        message: `Ressuprimento de palete completo solicitado em ${endereco}`,
      });
    }, RESSUPRIMENTO_SUBMIT_MS);
  }, [resultado, ressuprimentoDraft, isSubmittingRessuprimento, showFeedback]);

  const abrirSolicitarPrioridade = useCallback(
    (localizacao: Localizacao) => {
      if (!resultado) return;
      const ordem = localizacao.ordemRessuprimento;
      if (localizacao.tipo !== 'picking' || !ordem) {
        hapticError();
        showFeedback({
          variant: 'error',
          message: 'Nenhuma ordem de ressuprimento ativa neste endereço',
        });
        return;
      }

      hapticMedium();
      setPrioridadeDraft({
        localizacaoId: localizacao.id,
        endereco: localizacao.endereco,
        produtoNome: resultado.nome,
        sku: resultado.sku,
        ordemId: ordem.ordemId,
        prioridadeJaSolicitada: ordem.prioridadeSolicitada === true,
      });
      setPrioridadeSheetOpen(true);
    },
    [resultado, showFeedback],
  );

  const handlePrioridadeSheetOpenChange = useCallback((open: boolean) => {
    setPrioridadeSheetOpen(open);
    if (!open) {
      setPrioridadeDraft(null);
      setIsSubmittingPrioridade(false);
      if (prioridadeTimerRef.current) {
        clearTimeout(prioridadeTimerRef.current);
        prioridadeTimerRef.current = null;
      }
    }
  }, []);

  const confirmarSolicitarPrioridade = useCallback(() => {
    if (!resultado || !prioridadeDraft || isSubmittingPrioridade) return;
    if (prioridadeDraft.prioridadeJaSolicitada) {
      setPrioridadeSheetOpen(false);
      setPrioridadeDraft(null);
      return;
    }

    setIsSubmittingPrioridade(true);
    hapticMedium();

    if (prioridadeTimerRef.current) clearTimeout(prioridadeTimerRef.current);

    prioridadeTimerRef.current = setTimeout(() => {
      prioridadeTimerRef.current = null;
      const { localizacaoId, ordemId, endereco } = prioridadeDraft;

      setResultado((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          localizacoes: prev.localizacoes.map((loc) => {
            if (loc.id !== localizacaoId || !loc.ordemRessuprimento) return loc;
            return {
              ...loc,
              ordemRessuprimento: {
                ...loc.ordemRessuprimento,
                prioridadeSolicitada: true,
              },
            };
          }),
        };
      });

      setIsSubmittingPrioridade(false);
      setPrioridadeSheetOpen(false);
      setPrioridadeDraft(null);
      hapticMedium();
      showFeedback({
        variant: 'success',
        message: `Prioridade solicitada para ${ordemId} em ${endereco}`,
      });
    }, PRIORIDADE_SUBMIT_MS);
  }, [resultado, prioridadeDraft, isSubmittingPrioridade, showFeedback]);

  return {
    state: {
      query,
      isSearching,
      resultado,
      filtroTipo,
      localizacoesFiltradas,
      tipoCounts,
      tipoQuantidades,
      feedback,
      scannerOpen,
      ressuprimentoDraft,
      ressuprimentoSheetOpen,
      isSubmittingRessuprimento,
      prioridadeDraft,
      prioridadeSheetOpen,
      isSubmittingPrioridade,
    },
    actions: {
      setQuery,
      handleSearch,
      handleClear,
      setFiltroTipo: handleSetFiltroTipo,
      handleScanResult,
      openScanner,
      closeScanner,
      abrirSolicitarRessuprimento,
      handleRessuprimentoSheetOpenChange,
      confirmarSolicitarRessuprimento,
      abrirSolicitarPrioridade,
      handlePrioridadeSheetOpenChange,
      confirmarSolicitarPrioridade,
    },
  };
}
