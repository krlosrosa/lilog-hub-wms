'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  getOutrasViagensDisponiveis,
  getTripInfoByDemandaId,
  MOCK_DOCK_OPTIONS,
  MOCK_NFS,
  MOCK_NF_VALIDATION_ITEMS,
  MOCK_OUTRAS_VIAGENS,
} from '@/features/devolucao/mocks/devolucao-mock-data';
import type { DemandaFaltaPayload } from '@/features/devolucao/components/devolucao-demanda-falta-dialog';
import type { NfItem, NfRow } from '@/features/devolucao/types/devolucao-checkin.schema';

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

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useDevolucaoCheckin(demandId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [tripInfo] = useState(() => getTripInfoByDemandaId(demandId));
  const [dockOptions] = useState(() => [...MOCK_DOCK_OPTIONS]);
  const [docaId, setDocaId] = useState('d-04');
  const [cargaSegregada, setCargaSegregada] = useState(false);
  const [paletesRetornados, setPaletesRetornados] = useState(12);
  const [chapasPbr] = useState(4);
  const [nfs, setNfs] = useState<NfRow[]>(() =>
    MOCK_NFS.map((nf) => ({ ...nf, itens: [...nf.itens] })),
  );
  const [expandedNfIds, setExpandedNfIds] = useState<Set<string>>(
    () => new Set(['nf-1']),
  );
  const [validationItems, setValidationItems] = useState<ValidationItem[]>(() =>
    MOCK_NF_VALIDATION_ITEMS.map((item) => ({ ...item })),
  );
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [selectedNfNumero, setSelectedNfNumero] = useState('001.244.592');
  const [showAdicionarViagemDialog, setShowAdicionarViagemDialog] =
    useState(false);
  const [showDemandaFaltaDialog, setShowDemandaFaltaDialog] = useState(false);

  const outrasViagens = useMemo(
    () => getOutrasViagensDisponiveis(demandId, nfs),
    [demandId, nfs],
  );

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

  const abrirValidacaoNf = useCallback((numero: string) => {
    setSelectedNfNumero(numero);
    setShowValidationPanel(true);
  }, []);

  const fecharValidacaoNf = useCallback(() => {
    setShowValidationPanel(false);
  }, []);

  const salvarValidacaoNf = useCallback(async () => {
    setIsLoading(true);
    await delay(900);
    setIsLoading(false);
    setShowValidationPanel(false);
    return { success: true as const };
  }, []);

  const cancelarCheckin = useCallback(async () => {
    setIsLoading(true);
    await delay(700);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const liberarConferenciaCega = useCallback(async () => {
    setIsLoading(true);
    await delay(1200);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const resolverDivergencia = useCallback(async (nfId: string) => {
    setIsLoading(true);
    await delay(800);
    setNfs((prev) =>
      prev.map((nf) =>
        nf.id === nfId
          ? {
              ...nf,
              divergenciaCritica: false,
              status: 'parcial' as const,
              itensValidados: 1,
            }
          : nf,
      ),
    );
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const adicionarNfsDeOutraViagem = useCallback(
    async (viagemId: string, nfIds: string[]) => {
      setIsLoading(true);
      await delay(700);

      const viagem = MOCK_OUTRAS_VIAGENS.find((v) => v.id === viagemId);
      if (!viagem) {
        setIsLoading(false);
        return { success: false as const };
      }

      const nfsParaAdicionar = viagem.nfs
        .filter((nf) => nfIds.includes(nf.id))
        .map((nf) => ({
          ...nf,
          id: `${nf.id}-${Date.now()}`,
          itens: [...nf.itens],
          viagemOrigemId: viagem.id,
          viagemOrigemLabel: viagem.viagemRavexId,
        }));

      setNfs((prev) => [...prev, ...nfsParaAdicionar]);
      setExpandedNfIds((prev) => {
        const next = new Set(prev);
        for (const nf of nfsParaAdicionar) next.add(nf.id);
        return next;
      });

      setIsLoading(false);
      return {
        success: true as const,
        quantidade: nfsParaAdicionar.length,
        viagemLabel: viagem.viagemRavexId,
      };
    },
    [],
  );

  const removerNfExterna = useCallback(async (nfId: string) => {
    setIsLoading(true);
    await delay(400);
    setNfs((prev) => prev.filter((nf) => nf.id !== nfId));
    setExpandedNfIds((prev) => {
      const next = new Set(prev);
      next.delete(nfId);
      return next;
    });
    setIsLoading(false);
    return { success: true as const };
  }, []);

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

  const validarNf = useCallback(async (nfId: string) => {
    setIsLoading(true);
    await delay(600);

    let resultado: { success: boolean; numero?: string } = { success: false };

    setNfs((prev) =>
      prev.map((nf) => {
        if (nf.id !== nfId) return nf;

        if (!nf.motivo.trim()) {
          resultado = { success: false };
          return nf;
        }

        const itens = nf.itens.map((item) => ({
          ...item,
          status: deriveItemStatus(item.qtdDevolucao, item.qtdConferida),
        }));

        const updated = recalculateNf({
          ...nf,
          itens,
          divergenciaCritica: false,
        });

        resultado = { success: true, numero: nf.numero };
        return updated;
      }),
    );

    setIsLoading(false);
    return resultado.success
      ? { success: true as const, numero: resultado.numero! }
      : { success: false as const, reason: 'motivo' as const };
  }, []);

  const criarDemandaFalta = useCallback(
    async (itens: DemandaFaltaPayload[], observacao: string) => {
      setIsLoading(true);
      await delay(900);
      setShowDemandaFaltaDialog(false);
      setIsLoading(false);
      return {
        success: true as const,
        quantidade: itens.length,
        observacao,
      };
    },
    [],
  );

  return {
    isLoading,
    demandId,
    tripInfo,
    dockOptions,
    docaId,
    setDocaId,
    cargaSegregada,
    setCargaSegregada,
    paletesRetornados,
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
  };
}
