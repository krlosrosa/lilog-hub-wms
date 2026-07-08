'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { buscarProcessoDebito, atualizarStatusProcessoDebito } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import { mapProcessoParaDetalhe } from '@/features/debito-transportadora/lib/map-processo-debito';
import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';
import { ApiClientError } from '@/lib/api';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const CONFERENCIA_PAGE_SIZE = 10;

export function useDebitoDetalhe(debitoId: string) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [debito, setDebito] = useState<DebitoDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notasAnalista, setNotasAnalistaState] = useState('');
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [baixandoMapa, setBaixandoMapa] = useState(false);
  const [paginaConferencia, setPaginaConferenciaState] = useState(1);
  const [buscaConferencia, setBuscaConferenciaState] = useState('');

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setDebito(null);
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    try {
      const processo = await buscarProcessoDebito(debitoId, unidadeId);
      const detalhe = mapProcessoParaDetalhe(processo);

      setDebito(detalhe);
      setNotasAnalistaState(detalhe.notasAnalista);
    } catch (error) {
      setDebito(null);

      if (error instanceof ApiClientError && error.status === 404) {
        setNotFound(true);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o processo de débito.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [debitoId, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  const conferenciaLista = debito?.itensConferidos ?? [];

  const conferenciaFiltrados = useMemo(() => {
    const termo = buscaConferencia.trim().toLowerCase();

    if (!termo) {
      return conferenciaLista;
    }

    return conferenciaLista.filter(
      (item) =>
        item.sku.toLowerCase().includes(termo) ||
        item.produto.toLowerCase().includes(termo) ||
        item.nfNumero.toLowerCase().includes(termo),
    );
  }, [conferenciaLista, buscaConferencia]);

  const conferenciaTotalPaginas = Math.max(
    1,
    Math.ceil(conferenciaFiltrados.length / CONFERENCIA_PAGE_SIZE),
  );

  useEffect(() => {
    setPaginaConferenciaState(1);
  }, [debitoId]);

  useEffect(() => {
    setPaginaConferenciaState((prev) =>
      Math.min(prev, conferenciaTotalPaginas),
    );
  }, [conferenciaTotalPaginas]);

  const paginaConferenciaSegura = Math.min(
    paginaConferencia,
    conferenciaTotalPaginas,
  );

  const conferenciaItemsInicio =
    (paginaConferenciaSegura - 1) * CONFERENCIA_PAGE_SIZE;

  const conferenciaItensPagina = conferenciaFiltrados.slice(
    conferenciaItemsInicio,
    conferenciaItemsInicio + CONFERENCIA_PAGE_SIZE,
  );

  const setPaginaConferencia = useCallback(
    (pagina: number) => {
      const alvo = Math.max(1, Math.min(pagina, conferenciaTotalPaginas));
      setPaginaConferenciaState(alvo);
    },
    [conferenciaTotalPaginas],
  );

  const setBuscaConferencia = useCallback((value: string) => {
    setBuscaConferenciaState(value);
    setPaginaConferenciaState(1);
  }, []);

  const voltar = useCallback(() => {
    router.push('/debito-transportadora');
  }, [router]);

  const setNotasAnalista = useCallback((value: string) => {
    setNotasAnalistaState(value);
  }, []);

  const salvarNota = useCallback(async () => {
    if (!debito) {
      return;
    }

    setSalvandoNota(true);
    try {
      await delay(500);
      setDebito((prev) =>
        prev ? { ...prev, notasAnalista: notasAnalista } : prev,
      );
      toast.success('Nota salva (mock)');
    } finally {
      setSalvandoNota(false);
    }
  }, [debito, notasAnalista]);

  const enviarParaAssinatura = useCallback(async () => {
    if (!debito || !unidadeId) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await atualizarStatusProcessoDebito(debitoId, unidadeId, {
        status: 'aprovado',
      });
      await carregarDetalhe();
      toast.success('Ocorrência aprovada para cobrança', {
        description: debito.protocolo,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível aprovar a ocorrência.';

      toast.error(message);
    } finally {
      setProcessandoAcao(false);
    }
  }, [carregarDetalhe, debito, debitoId, unidadeId]);

  const cancelarCobranca = useCallback(async () => {
    if (!debito || !unidadeId) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await atualizarStatusProcessoDebito(debitoId, unidadeId, {
        status: 'cancelado',
      });
      await carregarDetalhe();
      toast.info('Ocorrência cancelada', {
        description: debito.protocolo,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível cancelar a ocorrência.';

      toast.error(message);
    } finally {
      setProcessandoAcao(false);
    }
  }, [carregarDetalhe, debito, debitoId, unidadeId]);

  const uploadEvidencia = useCallback(() => {
    toast.info('Upload de evidência em construção (mock)');
  }, []);

  const editarDados = useCallback(() => {
    toast.info('Edição de dados em construção (mock)');
  }, []);

  const baixarMapaSeparacao = useCallback(async () => {
    if (!debito?.mapaSeparacao) {
      return;
    }

    const mapa = debito.mapaSeparacao;
    const nomeArquivo = `Mapa_Separacao_${mapa.codigo}.pdf`;

    setBaixandoMapa(true);
    try {
      await delay(700);

      const linhas = [
        'Mapa de Separação — Lilog Hub',
        `Código: ${mapa.codigo}`,
        `Gerado em: ${mapa.geradoEm}`,
        `Protocolo: ${debito.protocolo}`,
        `Pedido: ${debito.pedido}`,
        `Itens: ${mapa.totalItens} | Volumes: ${mapa.totalVolumes}`,
        '',
        '--- Itens ---',
        ...debito.itensConferidos.map(
          (item) =>
            `${item.sku} | ${item.produto} | Qtd ${item.qtdAnomalia} | ${item.pesoTotalKg ?? 0} kg`,
        ),
      ];

      const blob = new Blob([linhas.join('\n')], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Mapa de separação baixado', {
        description: nomeArquivo,
      });
    } finally {
      setBaixandoMapa(false);
    }
  }, [debito]);

  const debitoComEstado = useMemo(() => {
    if (!debito) {
      return null;
    }

    return {
      ...debito,
      notasAnalista,
    };
  }, [debito, notasAnalista]);

  return {
    debito: debitoComEstado,
    isLoading,
    notFound,
    notasAnalista,
    setNotasAnalista,
    salvandoNota,
    processandoAcao,
    baixandoMapa,
    voltar,
    recarregar: carregarDetalhe,
    conferenciaItensPagina,
    conferenciaPagina: paginaConferenciaSegura,
    conferenciaTotalPaginas,
    conferenciaItemsInicio,
    conferenciaTotalItens: conferenciaFiltrados.length,
    conferenciaPageSize: CONFERENCIA_PAGE_SIZE,
    buscaConferencia,
    setBuscaConferencia,
    setPaginaConferencia,
    actions: {
      salvarNota,
      enviarParaAssinatura,
      cancelarCobranca,
      uploadEvidencia,
      editarDados,
      baixarMapaSeparacao,
    },
  };
}
