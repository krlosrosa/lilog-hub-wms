'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { MOCK_DEBITO_DETALHES } from '@/features/debito-transportadora/mocks/debitos-mock-data';
import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const CONFERENCIA_PAGE_SIZE = 10;

export function useDebitoDetalhe(debitoId: string) {
  const router = useRouter();

  const debitoInicial = MOCK_DEBITO_DETALHES[debitoId] ?? null;

  const [debito, setDebito] = useState<DebitoDetalhe | null>(debitoInicial);
  const [reasonCode, setReasonCodeState] = useState(
    debitoInicial?.reasonCode ?? '',
  );
  const [notasAnalista, setNotasAnalistaState] = useState(
    debitoInicial?.notasAnalista ?? '',
  );
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [baixandoMapa, setBaixandoMapa] = useState(false);
  const [paginaConferencia, setPaginaConferenciaState] = useState(1);

  const conferenciaLista = debito?.itensConferidos ?? [];

  const conferenciaTotalPaginas = Math.max(
    1,
    Math.ceil(conferenciaLista.length / CONFERENCIA_PAGE_SIZE),
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

  const conferenciaItensPagina = conferenciaLista.slice(
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

  const voltar = useCallback(() => {
    router.push('/debito-transportadora');
  }, [router]);

  const setReasonCode = useCallback((value: string) => {
    setReasonCodeState(value);
  }, []);

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
    if (!debito) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await delay(600);
      toast.success('Enviado para assinatura (mock)', {
        description: debito.protocolo,
      });
    } finally {
      setProcessandoAcao(false);
    }
  }, [debito]);

  const cancelarCobranca = useCallback(async () => {
    if (!debito) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await delay(500);
      toast.info('Cobrança cancelada (mock)', {
        description: debito.protocolo,
      });
    } finally {
      setProcessandoAcao(false);
    }
  }, [debito]);

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

    setBaixandoMapa(true);
    try {
      await delay(700);

      const linhas = [
        'Mapa de Separação — Lilog Hub (mock)',
        `Código: ${mapa.codigo}`,
        `Gerado em: ${mapa.geradoEm}`,
        `Protocolo: ${debito.protocolo}`,
        `Pedido: ${debito.pedido}`,
        `Itens: ${mapa.totalItens} | Volumes: ${mapa.totalVolumes}`,
        '',
        '--- Itens ---',
        ...debito.itensConferidos.map(
          (item) =>
            `${item.sku} | ${item.produto} | Lote ${item.lote} | Qtd ${item.qtdEsperada}`,
        ),
      ];

      const blob = new Blob([linhas.join('\n')], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = mapa.nomeArquivo;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Mapa de separação baixado (mock)', {
        description: mapa.nomeArquivo,
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
      reasonCode,
      notasAnalista,
    };
  }, [debito, reasonCode, notasAnalista]);

  return {
    debito: debitoComEstado,
    reasonCode,
    setReasonCode,
    notasAnalista,
    setNotasAnalista,
    salvandoNota,
    processandoAcao,
    baixandoMapa,
    voltar,
    conferenciaItensPagina,
    conferenciaPagina: paginaConferenciaSegura,
    conferenciaTotalPaginas,
    conferenciaItemsInicio,
    conferenciaTotalItens: conferenciaLista.length,
    conferenciaPageSize: CONFERENCIA_PAGE_SIZE,
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
