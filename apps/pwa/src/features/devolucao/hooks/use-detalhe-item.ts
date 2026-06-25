import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';

import { hapticLight } from '@/lib/haptics';

import { getConferenciaSkuSession } from '../lib/conferencia-sku-session';
import { getSkuItemsByDemandId } from './use-lista-itens';
import { useDemandById } from './use-demand-by-id';
import {
  detalheItemSchema,
  type DetalheItemForm,
  type LoteConferido,
} from '../types/devolucao.schema';

export type ScanTarget = 'lote' | 'idPalete';

const SCAN_TITLES: Record<ScanTarget, string> = {
  lote: 'Escanear lote (batch)',
  idPalete: 'Escanear ID do palete / WMS',
};

const MOCK_ITEM = {
  sku: '4920-XJ-99',
  name: 'Motor Síncrono Industrial - Modelo G3',
  supplier: 'Industrial Dynamics Corp.',
  expiry: '12/2025',
};

const EMPTY_VALUES: DetalheItemForm = {
  recebidaCaixa: '',
  recebidaUnidade: '',
  peso: '',
  lote: '',
  idPalete: '',
};

function createLoteId() {
  return `lote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const MOCK_LOTES_CONFERIDOS: LoteConferido[] = [
  {
    id: 'lote-mock-001',
    lote: 'LT-2024-8842',
    idPalete: 'P-0044-1208',
    recebidaCaixa: 4,
    recebidaUnidade: 96,
    peso: 48.5,
  },
  {
    id: 'lote-mock-002',
    lote: 'LT-2024-8843',
    idPalete: 'P-0044-1209',
    recebidaCaixa: 2,
    recebidaUnidade: 48,
    peso: 24,
  },
  {
    id: 'lote-mock-003',
    lote: 'LT-2024-9101',
    idPalete: '',
    recebidaCaixa: 1,
    recebidaUnidade: 12,
    peso: 6.75,
  },
];

export function useDetalheItem(demandId: string) {
  const demand = useDemandById(demandId);
  const navigate = useNavigate();
  const [lotesConferidos, setLotesConferidos] = useState<LoteConferido[]>(MOCK_LOTES_CONFERIDOS);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingConferencia, setIsSavingConferencia] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [sessionSku, setSessionSku] = useState<string | null>(() =>
    getConferenciaSkuSession(demandId)
  );

  useEffect(() => {
    setSessionSku(getConferenciaSkuSession(demandId));
  }, [demandId]);

  const item = useMemo(() => {
    if (!sessionSku) return MOCK_ITEM;

    const cargoItems = getSkuItemsByDemandId();
    const fromCargo = cargoItems.find(
      (cargo) => cargo.sku.toLowerCase() === sessionSku.toLowerCase()
    );

    if (fromCargo) {
      return {
        sku: fromCargo.sku,
        name: fromCargo.name,
        supplier: demand?.supplier ?? MOCK_ITEM.supplier,
        expiry: MOCK_ITEM.expiry,
        isNovo: false,
        isReentrega: fromCargo.isReentrega,
        quantidadeEsperada: fromCargo.quantidadeEsperada,
      };
    }

    return {
      sku: sessionSku,
      name: 'Item novo — conferência avulsa',
      supplier: demand?.supplier ?? MOCK_ITEM.supplier,
      expiry: '—',
      isNovo: true,
    };
  }, [demand?.supplier, sessionSku]);

  const form = useForm<DetalheItemForm>({
    resolver: zodResolver(detalheItemSchema),
    defaultValues: EMPTY_VALUES,
  });

  const conferidoTotais = useMemo(
    () =>
      lotesConferidos.reduce(
        (acc, lote) => ({
          caixa: acc.caixa + lote.recebidaCaixa,
          unidade: acc.unidade + lote.recebidaUnidade,
        }),
        { caixa: 0, unidade: 0 }
      ),
    [lotesConferidos]
  );

  const handleAddLote = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const entry: LoteConferido = {
      id: createLoteId(),
      lote: values.lote,
      idPalete: values.idPalete ?? '',
      recebidaCaixa: Number(values.recebidaCaixa),
      recebidaUnidade: Number(values.recebidaUnidade),
      peso: Number(values.peso),
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
    [form, scanTarget]
  );

  const handleScanOpenChange = useCallback((open: boolean) => {
    setScanOpen(open);
    if (!open) {
      setScanTarget(null);
    }
  }, []);

  const scanTitle = scanTarget ? SCAN_TITLES[scanTarget] : '';
  const canSaveConferencia = lotesConferidos.length > 0;

  const handleSaveConferencia = useCallback(async () => {
    if (!canSaveConferencia) return;

    setIsSavingConferencia(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSavingConferencia(false);
    navigate({ to: '/devolucao/$id/itens', params: { id: demandId } });
  }, [canSaveConferencia, demandId, navigate]);

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
