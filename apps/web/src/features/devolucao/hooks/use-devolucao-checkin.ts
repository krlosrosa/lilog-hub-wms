'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DemandaFaltaPayload } from '@/features/devolucao/components/devolucao-demanda-falta-dialog';
import {
  atualizarStatusDemanda,
  buscarDemandaDevolucao,
  registrarConferenciaItens,
  salvarChecklistDevolucao,
} from '@/features/devolucao/lib/devolucao-api';
import {
  canAccessRegistroChegada,
  mapDemandaToTripInfo,
  mapNfItemsToConferenciaPayload,
  mapNotasFiscaisToNfRows,
} from '@/features/devolucao/lib/devolucao-checkin-mappers';
import { listDocas } from '@/features/docas/lib/docas-api';
import type { NfItem, NfRow } from '@/features/devolucao/types/devolucao-checkin.schema';
import type {
  DockOption,
  OutraViagem,
  TripInfo,
} from '@/features/devolucao/types/devolucao-checkin.schema';
import type { DemandaDevolucaoStatus } from '@/features/devolucao/types/devolucao-gestao.schema';

type ValidationItem = {
  id: string;
  sku: string;
  produto: string;
  gtin?: string;
  qtdNf: number;
  qtdDevolucao: number;
  qtdConferida: number;
  motivo: string;
  status: NfItem['status'];
};

function deriveItemStatus(
  qtdDevolucao: number,
  qtdConferida: number,
): NfItem['status'] {
  if (qtdDevolucao === qtdConferida && qtdDevolucao > 0) return 'validado';
  if (qtdDevolucao === 0) return 'pendente';
  return 'divergente';
}

function deriveNfStatus(
  itensValidados: number,
  itensTotal: number,
  hasDivergencia: boolean,
): NfRow['status'] {
  if (hasDivergencia) return 'divergente';
  if (itensValidados >= itensTotal) return 'validado';
  if (itensValidados > 0) return 'parcial';
  return 'pendente';
}

function recalculateNf(nf: NfRow): NfRow {
  if (nf.itens.length === 0) return nf;

  const itensValidados = nf.itens.filter((i) => i.status === 'validado').length;
  const hasDivergencia = nf.itens.some((i) => i.status === 'divergente');
  const qtdDevolvida = nf.itens.reduce((acc, i) => acc + i.qtdDevolucao, 0);

  return {
    ...nf,
    qtdDevolvida,
    itensValidados,
    status: deriveNfStatus(itensValidados, nf.itensTotal, hasDivergencia),
  };
}

function mapNfItemToValidationItem(item: NfItem): ValidationItem {
  return {
    id: item.id,
    sku: item.sku,
    produto: item.produto,
    gtin: item.gtin,
    qtdNf: item.qtdNf,
    qtdDevolucao: item.qtdDevolucao,
    qtdConferida: item.qtdConferida,
    motivo: item.motivo,
    status: item.status,
  };
}

const EMPTY_TRIP_INFO: TripInfo = {
  motorista: '—',
  placa: '—',
  transportadora: '—',
  viagemRavexId: '—',
};

export function useDevolucaoCheckin(
  demandId: string,
  unidadeId: string | null,
) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codigoDemanda, setCodigoDemanda] = useState('—');
  const [statusDb, setStatusDb] = useState<DemandaDevolucaoStatus | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo>(EMPTY_TRIP_INFO);
  const [dockOptions, setDockOptions] = useState<DockOption[]>([]);
  const [docaId, setDocaId] = useState('');
  const [cargaSegregada, setCargaSegregada] = useState(false);
  const [paletesRetornados, setPaletesRetornados] = useState(0);
  const [tempBau, setTempBau] = useState('');
  const [tempProduto, setTempProduto] = useState('');
  const [chapasPbr] = useState(0);
  const [nfs, setNfs] = useState<NfRow[]>([]);
  const [expandedNfIds, setExpandedNfIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [selectedNfNumero, setSelectedNfNumero] = useState('');
  const [showAdicionarViagemDialog, setShowAdicionarViagemDialog] =
    useState(false);
  const [showDemandaFaltaDialog, setShowDemandaFaltaDialog] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!unidadeId) {
      setLoadError('Selecione uma unidade para continuar.');
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    setLoadError(null);

    try {
      const [demandaResponse, docasResponse] = await Promise.all([
        buscarDemandaDevolucao(demandId, unidadeId),
        listDocas({ unidadeId, limit: 100 }),
      ]);

      const mappedNfs = mapNotasFiscaisToNfRows(demandaResponse.notasFiscais);
      const mappedDockOptions: DockOption[] = docasResponse.items.map(
        (doca) => ({
          id: doca.id,
          label: doca.nome,
        }),
      );

      setCodigoDemanda(demandaResponse.codigoDemanda);
      setStatusDb(demandaResponse.status);
      setTripInfo(mapDemandaToTripInfo(demandaResponse));
      setNfs(mappedNfs);
      setDockOptions(mappedDockOptions);

      const checklist = demandaResponse.checklist;
      if (checklist) {
        const docaMatch = mappedDockOptions.find(
          (opt) => opt.label === checklist.dock || opt.id === checklist.dock,
        );
        setDocaId(docaMatch?.id ?? mappedDockOptions[0]?.id ?? '');
        setPaletesRetornados(checklist.paletesRecebidos);
        setCargaSegregada(Boolean(checklist.conditions.cargaSegregada));
        setTempBau(
          checklist.tempBau !== null ? String(checklist.tempBau) : '',
        );
        setTempProduto(
          checklist.tempProduto !== null ? String(checklist.tempProduto) : '',
        );
      } else {
        setDocaId(mappedDockOptions[0]?.id ?? '');
        setPaletesRetornados(0);
        setCargaSegregada(false);
        setTempBau('');
        setTempProduto('');
      }

      setExpandedNfIds(
        mappedNfs.length > 0 ? new Set([mappedNfs[0]!.id]) : new Set(),
      );
    } catch {
      setLoadError('Não foi possível carregar os dados da demanda.');
    } finally {
      setIsInitialLoading(false);
    }
  }, [demandId, unidadeId]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const outrasViagens = useMemo<OutraViagem[]>(() => [], []);

  const nfsOutrasViagens = useMemo(
    () => nfs.filter((nf) => Boolean(nf.viagemOrigemId)).length,
    [nfs],
  );

  const triagemPercent = useMemo(() => {
    const totalItens = nfs.reduce((acc, nf) => acc + nf.itensTotal, 0);
    const validados = nfs.reduce((acc, nf) => acc + nf.itensValidados, 0);
    if (totalItens === 0) return 0;
    return Math.round((validados / totalItens) * 100);
  }, [nfs]);

  const canAccessChegada = statusDb
    ? canAccessRegistroChegada(statusDb)
    : false;

  const toggleNfExpanded = useCallback((id: string) => {
    setExpandedNfIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const incrementPaletes = useCallback(() => {
    setPaletesRetornados((prev) => prev + 1);
  }, []);

  const decrementPaletes = useCallback(() => {
    setPaletesRetornados((prev) => Math.max(0, prev - 1));
  }, []);

  const updateValidationItem = useCallback(
    (
      id: string,
      field: 'qtdConferida' | 'motivo',
      value: number | string,
    ) => {
      setValidationItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (field === 'qtdConferida') {
            const qtd = typeof value === 'number' ? value : Number(value);
            const status: NfItem['status'] =
              qtd === item.qtdDevolucao
                ? 'validado'
                : qtd === 0
                  ? 'pendente'
                  : 'divergente';
            return { ...item, qtdConferida: qtd, status };
          }
          return { ...item, motivo: String(value) };
        }),
      );
    },
    [],
  );

  const abrirValidacaoNf = useCallback(
    (numero: string) => {
      const nf = nfs.find((row) => row.numero === numero);
      setSelectedNfNumero(numero);
      setValidationItems(nf ? nf.itens.map(mapNfItemToValidationItem) : []);
      setShowValidationPanel(true);
    },
    [nfs],
  );

  const fecharValidacaoNf = useCallback(() => {
    setShowValidationPanel(false);
  }, []);

  const salvarValidacaoNf = useCallback(async () => {
    if (!unidadeId) {
      return { success: false as const, error: 'Unidade não selecionada.' };
    }

    setIsLoading(true);

    try {
      await registrarConferenciaItens(demandId, {
        unidadeId,
        itens: validationItems.map((item) => ({
          itemId: item.id,
          qtdConferida:
            item.status === 'validado' ? item.qtdDevolucao : item.qtdConferida,
          condicao:
            item.status === 'validado'
              ? 'integro'
              : item.status === 'divergente'
                ? 'avariado'
                : 'nao_identificado',
          observacao: item.motivo || null,
        })),
      });

      await carregarDados();
      setShowValidationPanel(false);
      return { success: true as const };
    } catch {
      return {
        success: false as const,
        error: 'Não foi possível salvar a validação da nota.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [carregarDados, demandId, unidadeId, validationItems]);

  const cancelarCheckin = useCallback(async () => {
    return { success: true as const };
  }, []);

  const salvarChecklist = useCallback(async () => {
    if (!unidadeId) {
      return { success: false as const, error: 'Unidade não selecionada.' };
    }

    const dockSelecionada =
      dockOptions.find((opt) => opt.id === docaId)?.label ?? docaId;

    if (!dockSelecionada) {
      return { success: false as const, error: 'Selecione uma doca.' };
    }

    setIsLoading(true);

    try {
      const tempBauValue = tempBau.trim() ? Number(tempBau) : undefined;
      const tempProdutoValue = tempProduto.trim()
        ? Number(tempProduto)
        : undefined;

      await salvarChecklistDevolucao(demandId, unidadeId, {
        dock: dockSelecionada,
        paletesRecebidos: paletesRetornados,
        tempBau:
          tempBauValue !== undefined && !Number.isNaN(tempBauValue)
            ? tempBauValue
            : undefined,
        tempProduto:
          tempProdutoValue !== undefined && !Number.isNaN(tempProdutoValue)
            ? tempProdutoValue
            : undefined,
        conditions: { cargaSegregada },
      });
      return { success: true as const };
    } catch {
      return {
        success: false as const,
        error: 'Não foi possível salvar o checklist de entrada.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [cargaSegregada, demandId, docaId, dockOptions, paletesRetornados, tempBau, tempProduto, unidadeId]);

  const liberarConferenciaCega = useCallback(async () => {
    if (!unidadeId) {
      return { success: false as const, error: 'Unidade não selecionada.' };
    }

    setIsLoading(true);

    try {
      const checklistResult = await salvarChecklist();
      if (!checklistResult.success) {
        return checklistResult;
      }

      await atualizarStatusDemanda(demandId, unidadeId, {
        status: 'em_execucao',
        observacao: 'Liberado para conferência cega',
      });

      await carregarDados();
      return { success: true as const };
    } catch {
      return {
        success: false as const,
        error: 'Não foi possível liberar para conferência cega.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [carregarDados, demandId, salvarChecklist, unidadeId]);

  const resolverDivergencia = useCallback(
    async (nfId: string) => {
      if (!unidadeId) {
        return { success: false as const, error: 'Unidade não selecionada.' };
      }

      const nf = nfs.find((row) => row.id === nfId);
      if (!nf) {
        return { success: false as const, error: 'Nota fiscal não encontrada.' };
      }

      setIsLoading(true);

      try {
        await registrarConferenciaItens(demandId, {
          unidadeId,
          itens: mapNfItemsToConferenciaPayload(nf.itens),
        });
        await carregarDados();
        return { success: true as const };
      } catch {
        return {
          success: false as const,
          error: 'Não foi possível resolver a divergência.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [carregarDados, demandId, nfs, unidadeId],
  );

  const adicionarNfsDeOutraViagem = useCallback(
    async (
      _viagemId: string,
      _nfIds: string[],
    ): Promise<
      | { success: true; quantidade: number; viagemLabel: string }
      | { success: false }
    > => {
      // TODO: integrar com endpoint de vincular NFs de outra viagem (expedição)
      return { success: false };
    },
    [],
  );

  const removerNfExterna = useCallback(
    async (_nfId: string): Promise<{ success: true } | { success: false }> => {
      // TODO: integrar com endpoint de desvincular NF externa
      return { success: false };
    },
    [],
  );

  const updateNfItemQtdDevolucao = useCallback(
    (nfId: string, itemId: string, value: number) => {
      setNfs((prev) =>
        prev.map((nf) => {
          if (nf.id !== nfId) return nf;

          const itens = nf.itens.map((item) => {
            if (item.id !== itemId) return item;
            const qtdDevolucao = Math.max(
              0,
              Math.min(item.qtdNf, Math.floor(value)),
            );
            return {
              ...item,
              qtdDevolucao,
              status: deriveItemStatus(qtdDevolucao, item.qtdConferida),
            };
          });

          return recalculateNf({ ...nf, itens, status: 'pendente' });
        }),
      );
    },
    [],
  );

  const updateNfMotivo = useCallback((nfId: string, motivo: string) => {
    setNfs((prev) =>
      prev.map((nf) => (nf.id === nfId ? { ...nf, motivo } : nf)),
    );
  }, []);

  const validarNf = useCallback(
    async (nfId: string) => {
      if (!unidadeId) {
        return { success: false as const, reason: 'unidade' as const };
      }

      const nfAtual = nfs.find((row) => row.id === nfId);
      if (!nfAtual) {
        return { success: false as const, reason: 'notfound' as const };
      }

      if (!nfAtual.motivo.trim()) {
        return { success: false as const, reason: 'motivo' as const };
      }

      setIsLoading(true);

      try {
        const itensAtualizados = nfAtual.itens.map((item) => ({
          ...item,
          status: deriveItemStatus(item.qtdDevolucao, item.qtdConferida),
        }));

        await registrarConferenciaItens(demandId, {
          unidadeId,
          itens: mapNfItemsToConferenciaPayload(itensAtualizados),
        });

        await carregarDados();
        return { success: true as const, numero: nfAtual.numero };
      } catch {
        return { success: false as const, reason: 'api' as const };
      } finally {
        setIsLoading(false);
      }
    },
    [carregarDados, demandId, nfs, unidadeId],
  );

  const criarDemandaFalta = useCallback(
    async (itens: DemandaFaltaPayload[], observacao: string) => {
      if (!unidadeId) {
        return { success: false as const, error: 'Unidade não selecionada.' };
      }

      setIsLoading(true);

      try {
        await atualizarStatusDemanda(demandId, unidadeId, {
          status: 'em_analise',
          observacao: observacao || `Demanda de falta com ${itens.length} item(ns)`,
        });
        setShowDemandaFaltaDialog(false);
        await carregarDados();
        return {
          success: true as const,
          quantidade: itens.length,
          observacao,
        };
      } catch {
        return {
          success: false as const,
          error: 'Não foi possível registrar a demanda de falta.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [carregarDados, demandId, unidadeId],
  );

  return {
    isInitialLoading,
    isLoading,
    loadError,
    codigoDemanda,
    statusDb,
    canAccessChegada,
    demandId,
    tripInfo,
    dockOptions,
    docaId,
    setDocaId,
    cargaSegregada,
    setCargaSegregada,
    paletesRetornados,
    tempBau,
    setTempBau,
    tempProduto,
    setTempProduto,
    chapasPbr,
    incrementPaletes,
    decrementPaletes,
    nfs,
    expandedNfIds,
    toggleNfExpanded,
    triagemPercent,
    validationItems,
    updateValidationItem,
    showValidationPanel,
    selectedNfNumero,
    abrirValidacaoNf,
    fecharValidacaoNf,
    salvarValidacaoNf,
    salvarChecklist,
    cancelarCheckin,
    liberarConferenciaCega,
    resolverDivergencia,
    outrasViagens,
    nfsOutrasViagens,
    showAdicionarViagemDialog,
    setShowAdicionarViagemDialog,
    showDemandaFaltaDialog,
    setShowDemandaFaltaDialog,
    criarDemandaFalta,
    adicionarNfsDeOutraViagem,
    removerNfExterna,
    updateNfItemQtdDevolucao,
    updateNfMotivo,
    validarNf,
    recarregar: carregarDados,
  };
}
