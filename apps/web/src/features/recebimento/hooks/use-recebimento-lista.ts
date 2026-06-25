'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listDocas, mapDocaToListaItem } from '@/features/docas/lib/docas-api';
import {
  cancelPreRecebimento,
  listPreRecebimentos,
  mapPreRecebimentoToListaItem,
} from '@/features/recebimento/lib/recebimento-api';
import { MOCK_DOCAS } from '@/features/recebimento/mocks/recebimentos-mock-data';
import type {
  DocaItem,
  FiltroTurno,
  RecebimentoListaItem,
} from '@/features/recebimento/types/recebimento-lista.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 5;
const FETCH_LIMIT = 100;

/** Minutos desde meia-noite para comparação de turno. */
function paraMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const MANHA_ANTES_MINUTOS = 12 * 60;

function isPrevistoHoje(horarioPrevisto: string): boolean {
  const date = new Date(horarioPrevisto);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function mapDocaListaToDocaItem(
  doca: ReturnType<typeof mapDocaToListaItem>,
): DocaItem {
  const numero =
    Number.parseInt(doca.codigo.replace(/\D/g, ''), 10) ||
    Number.parseInt(doca.codigo, 10) ||
    1;

  const status =
    doca.situacao === 'manutencao'
      ? 'manutencao'
      : doca.situacao === 'ocupada'
        ? 'ocupada'
        : 'disponivel';

  return {
    numero,
    status,
    capacidadeToneladas: doca.capacidadeVeiculos ?? undefined,
    etiquetaManutencao: doca.situacao === 'manutencao' ? 'MANUT' : undefined,
  };
}

export function useRecebimentoLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docas, setDocas] = useState<DocaItem[]>(() => [...MOCK_DOCAS]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoListaItem[]>([]);
  const [filtroTurno, setFiltroTurnoState] = useState<FiltroTurno>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [preRecebimentosResponse, docasResponse] = await Promise.all([
        listPreRecebimentos({
          page: 1,
          limit: FETCH_LIMIT,
          unidadeId,
        }),
        listDocas({ page: 1, limit: 50, unidadeId }),
      ]);

      const items = preRecebimentosResponse.items
        .filter((item) => item.situacao !== 'cancelado')
        .map(mapPreRecebimentoToListaItem);

      setRecebimentos(items);

      if (docasResponse?.items.length) {
        setDocas(
          docasResponse.items
            .map(mapDocaToListaItem)
            .map(mapDocaListaToDocaItem),
        );
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os recebimentos';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const cancelarRecebimento = useCallback(
    async (id: string) => {
      setIsSubmitting(true);

      try {
        await cancelPreRecebimento(id);
        toast.success('Pré-recebimento cancelado');
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível cancelar o pré-recebimento';

        toast.error(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar],
  );

  const filtrados = useMemo(() => {
    let items = recebimentos;

    if (filtroTurno === 'manha') {
      items = items.filter((r) => paraMinutos(r.horario) < MANHA_ANTES_MINUTOS);
    } else if (filtroTurno === 'tarde') {
      items = items.filter(
        (r) => paraMinutos(r.horario) >= MANHA_ANTES_MINUTOS,
      );
    } else if (filtroTurno === 'atrasados') {
      items = items.filter((r) => r.isAtrasado);
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (r) =>
          r.placa.toLowerCase().includes(term) ||
          r.transportador.toLowerCase().includes(term) ||
          r.horario.includes(term) ||
          r.empresas.some((e) => e.toLowerCase().includes(term)),
      );
    }

    return items;
  }, [filtroTurno, busca, recebimentos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;
  const itemsPagina = filtrados.slice(itemsInicio, itemsInicio + PAGE_SIZE);

  const stats = useMemo(() => {
    const recebimentosHoje = recebimentos.filter((r) =>
      isPrevistoHoje(r.horarioPrevisto),
    );
    const volumeEsperado = recebimentosHoje.reduce(
      (acc, r) => acc + r.volumeUn,
      0,
    );
    const docasOcupadas = docas.filter((d) => d.status === 'ocupada').length;
    const docasTotal = docas.length;
    const atrasos = recebimentos.filter((r) => r.isAtrasado).length;

    return {
      hoje: recebimentosHoje.length,
      volumeEsperado,
      docasOcupadas,
      docasTotal,
      atrasos,
    };
  }, [docas, recebimentos]);

  const setFiltroTurno = useCallback((f: FiltroTurno) => {
    setFiltroTurnoState(f);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  return {
    isLoading,
    isSubmitting,
    docas,
    filtroTurno,
    setFiltroTurno,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    stats,
    pageSize: PAGE_SIZE,
    cancelarRecebimento,
    recarregar: carregar,
  };
}
