'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import {
  MOCK_IMPRESSAO_RESUMO,
  MOCK_LOTE_ENDERECOS,
} from '@/features/enderecos/mocks/enderecos-detail-mock-data';
import {
  impressaoAreaFormSchema,
  type ImpressaoAreaFormValues,
  type LoteEnderecoItem,
} from '@/features/enderecos/types/enderecos-impressao-etiqueta.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const DEFAULT_AREA: ImpressaoAreaFormValues = {
  galpao: 'WMS-ALPHA-01',
  ruaInicial: 'A-01',
  ruaFinal: 'B-12',
  niveis: ['01', '04'],
};

export function useEnderecosImpressaoEtiqueta() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lote, setLote] = useState<LoteEnderecoItem[]>(() => [
    ...MOCK_LOTE_ENDERECOS,
  ]);
  const [resumo, setResumo] = useState(() => ({ ...MOCK_IMPRESSAO_RESUMO }));
  const [previewIndex, setPreviewIndex] = useState(0);
  const [filtroLote, setFiltroLote] = useState('');

  const form = useForm<ImpressaoAreaFormValues>({
    resolver: zodResolver(impressaoAreaFormSchema),
    defaultValues: DEFAULT_AREA,
    mode: 'onSubmit',
  });

  const loteFiltrado = useMemo(() => {
    const term = filtroLote.trim().toLowerCase();
    if (!term) return lote;
    return lote.filter(
      (item) =>
        item.endereco.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term),
    );
  }, [lote, filtroLote]);

  const previewEndereco = lote[previewIndex]?.endereco ?? 'A-01-04-02';

  const toggleNivel = useCallback(
    (nivel: string) => {
      const current = form.getValues('niveis');
      const next = current.includes(nivel)
        ? current.filter((n) => n !== nivel)
        : [...current, nivel];
      form.setValue('niveis', next, { shouldValidate: true });
    },
    [form],
  );

  const adicionarAoLote = form.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await delay(500);
      const novo: LoteEnderecoItem = {
        id: `new-${Date.now()}`,
        endereco: `${data.ruaInicial}-${data.niveis[0] ?? '01'}-01`,
        tipo: 'Picking Palete',
        status: 'pronto',
      };
      setLote((prev) => [...prev, novo]);
      setResumo((prev) => ({
        ...prev,
        totalEtiquetas: prev.totalEtiquetas + 1,
      }));
      toast.success('Endereço adicionado ao lote');
    } finally {
      setIsLoading(false);
    }
  });

  const removerDoLote = useCallback((id: string) => {
    setLote((prev) => prev.filter((item) => item.id !== id));
    setResumo((prev) => ({
      ...prev,
      totalEtiquetas: Math.max(0, prev.totalEtiquetas - 1),
    }));
    toast.info('Item removido do lote');
  }, []);

  const limparLote = useCallback(async () => {
    setIsLoading(true);
    try {
      await delay(300);
      setLote([]);
      setResumo((prev) => ({ ...prev, totalEtiquetas: 0 }));
      toast.success('Lote limpo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const gerarLote = useCallback(async () => {
    if (lote.length === 0) {
      toast.error('Adicione endereços ao lote antes de gerar');
      return;
    }
    setIsGenerating(true);
    try {
      await delay(1500);
      toast.success('Lote enviado para impressão!', {
        description: `${lote.length} etiqueta(s) processada(s)`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [lote.length]);

  const previewAnterior = useCallback(() => {
    setPreviewIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const previewProxima = useCallback(() => {
    setPreviewIndex((prev) => Math.min(lote.length - 1, prev + 1));
  }, [lote.length]);

  const verHistorico = useCallback(() => {
    toast.info('Histórico de impressões em construção (mock)');
  }, []);

  const auditoriaEmMassa = useCallback(() => {
    toast.info('Auditoria em massa iniciada (mock)');
  }, []);

  const bloqueioInventario = useCallback(() => {
    toast.warning('Bloqueio de inventário aplicado ao lote (mock)');
  }, []);

  return {
    form,
    isLoading,
    isGenerating,
    lote: loteFiltrado,
    loteTotal: lote.length,
    resumo,
    previewEndereco,
    previewIndex,
    previewTotal: lote.length,
    filtroLote,
    setFiltroLote,
    toggleNivel,
    adicionarAoLote,
    removerDoLote,
    limparLote,
    gerarLote,
    previewAnterior,
    previewProxima,
    verHistorico,
    auditoriaEmMassa,
    bloqueioInventario,
  };
}
