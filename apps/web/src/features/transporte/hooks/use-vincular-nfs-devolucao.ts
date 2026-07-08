'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';
import {
  criarIntervaloPadraoOntemHoje,
  normalizarIntervaloData,
  type IntervaloData,
} from '@/features/torre-controle-expedicao/lib/intervalo-data';
import {
  listNfsDevolucaoElegiveis,
  vincularNfsDevolucaoTransporte,
  type DevolucaoNfElegivelApiItem,
} from '@/features/transporte/lib/expedicao-api';

type UseVincularNfsDevolucaoOptions = {
  transporteId: string | null;
  unidadeId: string | null;
  open: boolean;
  onVinculado?: () => void | Promise<void>;
};

function intervaloPreenchido(intervalo: IntervaloData): boolean {
  return Boolean(intervalo.dataInicio.trim() && intervalo.dataFim.trim());
}

export function useVincularNfsDevolucao({
  transporteId,
  unidadeId,
  open,
  onVinculado,
}: UseVincularNfsDevolucaoOptions) {
  const [notasFiscais, setNotasFiscais] = useState<DevolucaoNfElegivelApiItem[]>(
    [],
  );
  const [remessasReentregaVinculadas, setRemessasReentregaVinculadas] =
    useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [intervaloData, setIntervaloData] = useState<IntervaloData>(() =>
    criarIntervaloPadraoOntemHoje(),
  );

  const carregarNfs = useCallback(async () => {
    if (!transporteId || !unidadeId || !intervaloPreenchido(intervaloData)) {
      return;
    }

    setCarregando(true);

    try {
      const intervalo = normalizarIntervaloData(intervaloData);
      const response = await listNfsDevolucaoElegiveis(
        transporteId,
        unidadeId,
        intervalo,
      );
      setNotasFiscais(response.notasFiscais);
      setRemessasReentregaVinculadas(response.remessasReentregaVinculadas);
      setSelecionados(new Set());
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as NFs de devolução.';
      toast.error(message);
    } finally {
      setCarregando(false);
    }
  }, [transporteId, unidadeId, intervaloData]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIntervaloData(criarIntervaloPadraoOntemHoje());
    setNotasFiscais([]);
    setRemessasReentregaVinculadas(0);
    setSelecionados(new Set());
  }, [open]);

  useEffect(() => {
    if (!open || !intervaloPreenchido(intervaloData)) {
      return;
    }

    void carregarNfs();
  }, [open, intervaloData, carregarNfs]);

  const toggleSelecionado = useCallback((nfId: string) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(nfId)) {
        proximo.delete(nfId);
      } else {
        proximo.add(nfId);
      }

      return proximo;
    });
  }, []);

  const vincularSelecionados = useCallback(async () => {
    if (!transporteId || !unidadeId || selecionados.size === 0) {
      return;
    }

    setVinculando(true);

    try {
      const response = await vincularNfsDevolucaoTransporte(transporteId, {
        unidadeId,
        nfIds: [...selecionados],
      });

      toast.success(
        `${response.remessasCriadas} NF(s) adicionada(s) ao transporte.`,
      );

      await carregarNfs();
      await onVinculado?.();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível vincular as NFs ao transporte.';
      toast.error(message);
    } finally {
      setVinculando(false);
    }
  }, [
    transporteId,
    unidadeId,
    selecionados,
    carregarNfs,
    onVinculado,
  ]);

  return {
    notasFiscais,
    remessasReentregaVinculadas,
    selecionados,
    carregando,
    vinculando,
    intervaloData,
    setIntervaloData,
    toggleSelecionado,
    vincularSelecionados,
    recarregar: carregarNfs,
  };
}
