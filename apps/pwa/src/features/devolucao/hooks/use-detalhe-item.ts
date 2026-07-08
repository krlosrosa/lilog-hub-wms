import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';

import { hapticLight } from '@/lib/haptics';
import { useUnidade } from '@/features/unidade';

import { searchProduto } from '../lib/devolucao-api';
import {
  getConferenciaItemSession,
  getConferenciaSkuSession,
} from '../lib/conferencia-sku-session';
import {
  buildLotesFromApiConferencia,
  findDevolucaoItemInDetalhe,
  getConferenciaRascunho,
  saveConferenciaRascunho,
} from '../lib/devolucao-conferencia-rascunho';
import {
  fetchParametrosDevolucaoConferencia,
  getCachedParametrosDevolucaoConferencia,
} from '../lib/devolucao-config';
import { getSkuItemsByDemandId } from '../lib/devolucao-sku-items';
import { syncDevolucaoConferencia } from '../lib/devolucao-sync';
import { useDemandaDetalhe, useDemandById } from './use-demand-by-id';
import {
  buildDetalheItemSchema,
  DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA,
  type DetalheItemForm,
  type LoteConferido,
  type ParametrosDevolucaoConferencia,
  type QuantidadeModo,
} from '../types/devolucao.schema';

export type ScanTarget = 'lote' | 'idPalete';

const SCAN_TITLES: Record<ScanTarget, string> = {
  lote: 'Escanear lote (batch)',
  idPalete: 'Escanear ID do palete / WMS',
};

const EMPTY_VALUES: DetalheItemForm = {
  recebidaCaixa: '',
  recebidaUnidade: '',
  peso: '',
  lote: '',
  dataFabricacao: '',
  idPalete: '',
};

function createLoteId() {
  return `lote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveQtdConferidaTotal(
  totais: { caixa: number; unidade: number },
  quantidadeModo: QuantidadeModo,
): number {
  if (quantidadeModo === 'caixa') {
    return totais.caixa;
  }

  if (quantidadeModo === 'unidade') {
    return totais.unidade;
  }

  return totais.unidade > 0 ? totais.unidade : totais.caixa;
}

export function useDetalheItem(demandId: string) {
  const demand = useDemandById(demandId);
  const detalhe = useDemandaDetalhe(demandId);
  const { unidadeSelecionada } = useUnidade();
  const navigate = useNavigate();
  const [lotesConferidos, setLotesConferidos] = useState<LoteConferido[]>([]);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingConferencia, setIsSavingConferencia] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [session, setSession] = useState(() => getConferenciaItemSession(demandId));
  const [catalogDescricao, setCatalogDescricao] = useState<string | null>(
    () => getConferenciaItemSession(demandId)?.descricao ?? null,
  );
  const [parametrosConferencia, setParametrosConferencia] =
    useState<ParametrosDevolucaoConferencia>(() =>
      unidadeSelecionada?.id
        ? getCachedParametrosDevolucaoConferencia(unidadeSelecionada.id)
        : DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA,
    );

  const items =
    useLiveQuery(
      () => getSkuItemsByDemandId(demandId),
      [demandId, detalhe?.cachedAt],
    ) ?? [];

  useEffect(() => {
    setSession(getConferenciaItemSession(demandId));
    setCatalogDescricao(getConferenciaItemSession(demandId)?.descricao ?? null);
  }, [demandId]);

  useEffect(() => {
    const sessionSku = session?.sku ?? getConferenciaSkuSession(demandId);
    if (!sessionSku) {
      return;
    }

    const fromItems = items.find(
      (cargo) => cargo.sku.toLowerCase() === sessionSku.toLowerCase(),
    );
    if (fromItems) {
      return;
    }

    const sessionDescricao = session?.descricao ?? getConferenciaItemSession(demandId)?.descricao;
    if (sessionDescricao) {
      setCatalogDescricao(sessionDescricao);
      return;
    }

    void searchProduto(sessionSku).then((produto) => {
      if (produto) {
        setCatalogDescricao(produto.descricao);
      }
    });
  }, [demandId, items, session?.descricao, session?.sku]);

  useEffect(() => {
    const itemId = session?.itemId;
    if (!itemId) {
      setLotesConferidos([]);
      return;
    }

    void (async () => {
      const rascunho = await getConferenciaRascunho(demandId, itemId);
      if (rascunho?.lotes.length) {
        setLotesConferidos(rascunho.lotes);
        return;
      }

      const apiItem = findDevolucaoItemInDetalhe(detalhe, itemId);
      if (apiItem?.qtdConferida != null) {
        setLotesConferidos(
          buildLotesFromApiConferencia(apiItem, parametrosConferencia.quantidadeModo),
        );
        return;
      }

      setLotesConferidos([]);
    })();
  }, [demandId, detalhe, parametrosConferencia.quantidadeModo, session?.itemId]);

  useEffect(() => {
    if (!unidadeSelecionada?.id) {
      return;
    }

    void fetchParametrosDevolucaoConferencia(unidadeSelecionada.id).then(
      setParametrosConferencia,
    );
  }, [unidadeSelecionada?.id]);

  const item = useMemo(() => {
    const sessionSku = session?.sku ?? getConferenciaSkuSession(demandId);
    if (!sessionSku) {
      return null;
    }

    const fromItems = items.find(
      (cargo) => cargo.sku.toLowerCase() === sessionSku.toLowerCase(),
    );

    if (fromItems) {
      return {
        sku: fromItems.sku,
        name: fromItems.name,
        supplier: demand?.supplier ?? detalhe?.cliente ?? '—',
        expiry: '—',
        isNovo: false,
        isReentrega: fromItems.isReentrega,
        quantidadeEsperada: fromItems.qtdEsperada ?? fromItems.quantidadeEsperada,
        itemId: fromItems.itemId,
        pesoVariavel: fromItems.pesoVariavel ?? false,
      };
    }

    return {
      sku: sessionSku,
      name: catalogDescricao ?? 'Item — conferência avulsa',
      supplier: demand?.supplier ?? detalhe?.cliente ?? '—',
      expiry: '—',
      isNovo: true,
      itemId: session?.itemId,
      pesoVariavel: false,
    };
  }, [catalogDescricao, demand?.supplier, detalhe?.cliente, demandId, items, session]);

  const detalheItemSchema = useMemo(
    () =>
      buildDetalheItemSchema({
        pesoVariavel: item?.pesoVariavel ?? false,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        loteModo: parametrosConferencia.loteModo,
        controlaPalete: parametrosConferencia.controlaPalete,
      }),
    [item?.pesoVariavel, parametrosConferencia],
  );

  const form = useForm<DetalheItemForm>({
    resolver: zodResolver(detalheItemSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    form.clearErrors();
  }, [detalheItemSchema, form]);

  const conferidoTotais = useMemo(
    () =>
      lotesConferidos.reduce(
        (acc, lote) => ({
          caixa: acc.caixa + lote.recebidaCaixa,
          unidade: acc.unidade + lote.recebidaUnidade,
        }),
        { caixa: 0, unidade: 0 },
      ),
    [lotesConferidos],
  );

  const handleAddLote = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    const entry: LoteConferido = {
      id: createLoteId(),
      lote: values.lote ?? '',
      dataFabricacao: values.dataFabricacao ?? '',
      idPalete: values.idPalete ?? '',
      recebidaCaixa: Number(values.recebidaCaixa || 0),
      recebidaUnidade: Number(values.recebidaUnidade || 0),
      peso: values.peso ? Number(values.peso) : undefined,
    };

    setLotesConferidos((prev) => [...prev, entry]);
    form.reset(EMPTY_VALUES);
    setIsSubmitting(false);
  });

  const toggleLotesListExpanded = useCallback(() => {
    setLotesListExpanded((prev) => !prev);
  }, []);

  const removeLote = useCallback((id: string) => {
    setLotesConferidos((prev) => prev.filter((lote) => lote.id !== id));
  }, []);

  const openScan = useCallback((target: ScanTarget) => {
    hapticLight();
    setScanTarget(target);
    setScanOpen(true);
  }, []);

  const handleScanResult = useCallback(
    (text: string) => {
      if (!scanTarget) return;
      form.setValue(scanTarget, text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, scanTarget],
  );

  const handleScanOpenChange = useCallback((open: boolean) => {
    setScanOpen(open);
    if (!open) {
      setScanTarget(null);
    }
  }, []);

  const scanTitle = scanTarget ? SCAN_TITLES[scanTarget] : '';
  const isEditingConferido = useMemo(() => {
    const sessionSku = session?.sku ?? getConferenciaSkuSession(demandId);
    if (!sessionSku) {
      return false;
    }

    return items.some(
      (cargo) =>
        cargo.sku.toLowerCase() === sessionSku.toLowerCase() &&
        cargo.status === 'conferido',
    );
  }, [demandId, items, session?.sku]);
  const canSaveConferencia = lotesConferidos.length > 0 && Boolean(item?.itemId);

  const handleSaveConferencia = useCallback(async () => {
    if (!canSaveConferencia || !item?.itemId || !unidadeSelecionada?.id) {
      return;
    }

    setIsSavingConferencia(true);

    const qtdConferidaTotal = resolveQtdConferidaTotal(
      conferidoTotais,
      parametrosConferencia.quantidadeModo,
    );
    const condicao =
      qtdConferidaTotal < (item.quantidadeEsperada ?? qtdConferidaTotal)
        ? 'nao_identificado'
        : 'integro';

    const primeiroLote = lotesConferidos[0];

    await saveConferenciaRascunho({
      demandId,
      itemId: item.itemId,
      sku: item.sku,
      lotes: lotesConferidos,
      qtdConferidaTotal,
      condicao,
    });

    await syncDevolucaoConferencia(
      demandId,
      {
        unidadeId: unidadeSelecionada.id,
        itens: [
          {
            itemId: item.itemId,
            qtdConferida: qtdConferidaTotal,
            lote: primeiroLote?.lote || null,
            dataFabricacao: primeiroLote?.dataFabricacao || null,
            condicao,
          },
        ],
      },
      `Conferência ${item.sku}`,
    );

    setIsSavingConferencia(false);
    navigate({ to: '/devolucao/$id/itens', params: { id: demandId } });
  }, [
    canSaveConferencia,
    conferidoTotais,
    demandId,
    item,
    lotesConferidos,
    navigate,
    parametrosConferencia.quantidadeModo,
    unidadeSelecionada?.id,
  ]);

  return {
    state: {
      demandId,
      item,
      form,
      lotesConferidos,
      lotesListExpanded,
      isSubmitting,
      errors: form.formState.errors,
      conferidoTotais,
      hasLotesConferidos: lotesConferidos.length > 0,
      canSaveConferencia,
      isSavingConferencia,
      scanOpen,
      scanTarget,
      scanTitle,
      parametrosConferencia,
      isEditingConferido,
    },
    actions: {
      handleAddLote,
      register: form.register,
      openScan,
      handleScanResult,
      handleScanOpenChange,
      toggleLotesListExpanded,
      removeLote,
      handleSaveConferencia,
    },
  };
}
