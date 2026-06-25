'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  buscarMapaGrupoPorCodigo,
  solicitarCorteOperacional,
} from '@/features/corte-operacional/lib/corte-operacional-api';
import type {
  ItemSelecionadoCorte,
  MapaGrupoCorte,
} from '@/features/corte-operacional/types/corte-operacional.schema';
import { ApiClientError } from '@/lib/api';

function criarSelecaoInicial(mapa: MapaGrupoCorte): ItemSelecionadoCorte[] {
  return mapa.itens.map((item) => ({
    mapaGrupoItemId: item.id,
    selecionado: false,
    quantidadeCorte: item.quantidade,
    quantidadeMapa: item.quantidade,
  }));
}

export function useSolicitarCorteOperacional() {
  const { unidadeSelecionada } = useUnidadeContext();
  const [codigoBip, setCodigoBip] = useState('');
  const [mapa, setMapa] = useState<MapaGrupoCorte | null>(null);
  const [selecao, setSelecao] = useState<ItemSelecionadoCorte[]>([]);
  const [doca, setDoca] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarMapa = useCallback(async () => {
    if (!unidadeSelecionada) {
      toast.error('Selecione uma unidade');
      return;
    }

    const codigo = codigoBip.trim();
    if (!codigo) {
      toast.error('Informe ou bipe o código do mapa-grupo');
      return;
    }

    setBuscando(true);
    setErro(null);

    try {
      const resultado = await buscarMapaGrupoPorCodigo(
        unidadeSelecionada.id,
        codigo,
      );
      setMapa(resultado);
      setSelecao(criarSelecaoInicial(resultado));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Mapa-grupo não encontrado';
      setErro(message);
      setMapa(null);
      setSelecao([]);
      toast.error(message);
    } finally {
      setBuscando(false);
    }
  }, [codigoBip, unidadeSelecionada]);

  const toggleItem = useCallback((mapaGrupoItemId: string, checked: boolean) => {
    setSelecao((prev) =>
      prev.map((item) =>
        item.mapaGrupoItemId === mapaGrupoItemId
          ? { ...item, selecionado: checked }
          : item,
      ),
    );
  }, []);

  const alterarQuantidade = useCallback(
    (mapaGrupoItemId: string, quantidadeCorte: number) => {
      setSelecao((prev) =>
        prev.map((item) =>
          item.mapaGrupoItemId === mapaGrupoItemId
            ? { ...item, quantidadeCorte }
            : item,
        ),
      );
    },
    [],
  );

  const solicitar = useCallback(async () => {
    if (!unidadeSelecionada || !mapa) {
      return null;
    }

    const itensSelecionados = selecao.filter(
      (item) => item.selecionado && item.quantidadeCorte > 0,
    );

    if (itensSelecionados.length === 0) {
      toast.error('Selecione ao menos um item com quantidade válida');
      return null;
    }

    const invalido = itensSelecionados.find(
      (item) => item.quantidadeCorte > item.quantidadeMapa,
    );

    if (invalido) {
      toast.error('Quantidade de corte não pode exceder a quantidade do mapa');
      return null;
    }

    setEnviando(true);

    try {
      const corte = await solicitarCorteOperacional({
        unidadeId: unidadeSelecionada.id,
        mapaGrupoId: mapa.id,
        mapaGrupoMicroUuid: mapa.microUuid,
        doca: doca.trim() || undefined,
        motivo: motivo.trim() || undefined,
        observacao: observacao.trim() || undefined,
        itens: itensSelecionados.map((item) => ({
          mapaGrupoItemId: item.mapaGrupoItemId,
          quantidadeCorte: item.quantidadeCorte,
        })),
      });

      toast.success(`Corte ${corte.codigo} solicitado com sucesso`);
      return corte;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Erro ao solicitar corte';
      toast.error(message);
      return null;
    } finally {
      setEnviando(false);
    }
  }, [doca, mapa, motivo, observacao, selecao, unidadeSelecionada]);

  const limparMapa = useCallback(() => {
    setMapa(null);
    setSelecao([]);
    setErro(null);
  }, []);

  return {
    codigoBip,
    setCodigoBip,
    mapa,
    selecao,
    doca,
    setDoca,
    motivo,
    setMotivo,
    observacao,
    setObservacao,
    buscando,
    enviando,
    erro,
    buscarMapa,
    toggleItem,
    alterarQuantidade,
    solicitar,
    limparMapa,
  };
}
