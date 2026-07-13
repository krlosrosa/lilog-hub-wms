import { useCallback, useEffect, useState } from 'react';

import {
  adicionarFuncionarioApoio,
  encerrarFuncionarioApoio,
  getApoioCandidatos,
} from '@/features/gestao-recursos/api/gestao-recursos-api';
import type { FuncionarioApoioCandidatoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

export function useFuncionarioApoio(
  sessaoId: string | undefined,
  onRefresh: () => void | Promise<void>,
) {
  const [candidatos, setCandidatos] = useState<FuncionarioApoioCandidatoApi[]>(
    [],
  );
  const [apoioSheetOpen, setApoioSheetOpen] = useState(false);
  const [isLoadingCandidatos, setIsLoadingCandidatos] = useState(false);
  const [adicionandoId, setAdicionandoId] = useState<number | null>(null);
  const [encerrandoId, setEncerrandoId] = useState<string | null>(null);
  const [candidatosError, setCandidatosError] = useState<string | null>(null);

  const loadCandidatos = useCallback(async () => {
    if (!sessaoId) {
      setCandidatos([]);
      return;
    }

    setIsLoadingCandidatos(true);
    setCandidatosError(null);

    try {
      const response = await getApoioCandidatos(sessaoId);
      setCandidatos(response.items);
    } catch (error) {
      setCandidatos([]);
      setCandidatosError(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar candidatos de apoio',
      );
    } finally {
      setIsLoadingCandidatos(false);
    }
  }, [sessaoId]);

  useEffect(() => {
    if (apoioSheetOpen) {
      void loadCandidatos();
    }
  }, [apoioSheetOpen, loadCandidatos]);

  const openApoioSheet = useCallback(() => {
    setApoioSheetOpen(true);
  }, []);

  const closeApoioSheet = useCallback(() => {
    setApoioSheetOpen(false);
  }, []);

  const handleAdicionarApoio = useCallback(
    async (funcionarioId: number) => {
      if (!sessaoId) return;

      setAdicionandoId(funcionarioId);
      try {
        await adicionarFuncionarioApoio(sessaoId, funcionarioId);
        setApoioSheetOpen(false);
        await onRefresh();
      } finally {
        setAdicionandoId(null);
      }
    },
    [sessaoId, onRefresh],
  );

  const handleEncerrarApoio = useCallback(
    async (sessaoFuncionarioId: string) => {
      if (!sessaoId) return;

      setEncerrandoId(sessaoFuncionarioId);
      try {
        await encerrarFuncionarioApoio(sessaoId, sessaoFuncionarioId);
        await onRefresh();
      } finally {
        setEncerrandoId(null);
      }
    },
    [sessaoId, onRefresh],
  );

  return {
    candidatos,
    apoioSheetOpen,
    isLoadingCandidatos,
    adicionandoId,
    encerrandoId,
    candidatosError,
    openApoioSheet,
    closeApoioSheet,
    handleAdicionarApoio,
    handleEncerrarApoio,
    reloadCandidatos: loadCandidatos,
  };
}
