'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import {
  calcularResumoMapaSeparacao,
  montarMapasSeparacao,
} from '@/features/transporte/lib/montar-mapas-separacao';
import { sugerirConfigInteligente } from '@/features/transporte/lib/sugerir-config-mapa-separacao';
import { MOCK_TRANSPORTES } from '@/features/transporte/mocks/transporte.mock';
import {
  CAMPO_MAPA_LABELS,
  criarConfigEspecifica,
  DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO,
  FORMATO_PAPEL_LABELS,
  MODO_INTELIGENCIA_LABELS,
  ORDENACAO_MAPA_LABELS,
  TIPO_DESTINO_ALOCACAO_LABELS,
  TIPO_SEPARACAO_LABELS,
  type CampoMapa,
  type ConfigEspecificaTipoSeparacao,
  type ConfigImpressaoMapaSeparacao,
  type FormatoPapel,
  type MetaVelocidade,
  type ModoInteligencia,
  type OrdenacaoMapa,
  type SugestaoInteligente,
  type TipoDestinoAlocacao,
  type TipoSeparacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

function encontrarTransporte(termo: string): TransporteGrupo | undefined {
  const normalizado = termo.trim().toLowerCase();
  if (!normalizado) {
    return undefined;
  }

  return MOCK_TRANSPORTES.find(
    (transporte) =>
      transporte.id.toLowerCase() === normalizado ||
      transporte.id.toLowerCase().includes(normalizado) ||
      transporte.rota.toLowerCase().includes(normalizado) ||
      transporte.regiao.toLowerCase().includes(normalizado) ||
      transporte.cidade.toLowerCase().includes(normalizado),
  );
}

export function useImpressaoMapaSeparacao() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transportes] = useState<TransporteGrupo[]>(() => [...MOCK_TRANSPORTES]);
  const [busca, setBusca] = useState('');
  const [transporteAtivo, setTransporteAtivo] =
    useState<TransporteGrupo | null>(null);
  const [config, setConfig] = useState<ConfigImpressaoMapaSeparacao>(
    DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO,
  );
  const [previewAberto, setPreviewAberto] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [modoInteligencia, setModoInteligencia] =
    useState<ModoInteligencia>('manual');
  const [qtdSeparadores, setQtdSeparadores] = useState(2);
  const [metaVelocidade, setMetaVelocidade] =
    useState<MetaVelocidade>('balanceado');
  const [sugestaoInteligente, setSugestaoInteligente] =
    useState<SugestaoInteligente | null>(null);

  const marcarConfigManual = useCallback(() => {
    setModoInteligencia('manual');
    setSugestaoInteligente(null);
  }, []);

  const resultado = useMemo(() => {
    if (!transporteAtivo) {
      return null;
    }

    return montarMapasSeparacao(transporteAtivo, config);
  }, [config, transporteAtivo]);

  const resumo = useMemo(
    () => calcularResumoMapaSeparacao(transporteAtivo, config),
    [config, transporteAtivo],
  );

  const sugestoes = useMemo(
    () => transportes.slice(0, 3),
    [transportes],
  );

  const tagsConfiguracao = useMemo(() => {
    if (!transporteAtivo || !resultado) {
      return [];
    }

    return [
      ...(modoInteligencia !== 'manual'
        ? [MODO_INTELIGENCIA_LABELS[modoInteligencia]]
        : []),
      TIPO_SEPARACAO_LABELS[config.tipoSeparacao],
      `${resultado.totalMapas} mapa(s)`,
      FORMATO_PAPEL_LABELS[config.formatoPapel],
      ORDENACAO_MAPA_LABELS[config.ordenacao],
      config.itensPorFolha === 0
        ? 'Itens ilimitados'
        : `${config.itensPorFolha} itens/folha`,
      config.mapaPorOperador ? 'Mapa por operador' : 'Mapa único',
      `Alocar: ${TIPO_DESTINO_ALOCACAO_LABELS[config.destinoAlocacao.tipo]} ${config.destinoAlocacao.referencia}`,
      ...(config.destinoAlocacao.gerarDemandaEmpilhadeira
        ? ['Demanda empilhadeira ativa']
        : []),
      'QR Code de validação',
      ...config.campos.map((campo) => CAMPO_MAPA_LABELS[campo]),
    ];
  }, [config, modoInteligencia, resultado, transporteAtivo]);

  const carregarTransporte = useCallback(
    (termo: string) => {
      const encontrado = encontrarTransporte(termo);
      if (!encontrado) {
        toast.error('Transporte não encontrado. Tente pelo ID ou rota.');
        return false;
      }

      setTransporteAtivo(encontrado);
      setBusca(encontrado.id);
      setSugestaoInteligente(null);
      toast.success(`Transporte ${encontrado.rota} carregado.`);
      return true;
    },
    [],
  );

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      carregarTransporte(idParam);
    }
  }, [carregarTransporte, searchParams]);

  const selecionarTipoSeparacao = useCallback((tipo: TipoSeparacao) => {
    marcarConfigManual();
    setConfig((prev) => ({
      ...prev,
      tipoSeparacao: tipo,
      configEspecifica: criarConfigEspecifica(tipo),
    }));
  }, [marcarConfigManual]);

  const atualizarConfigEspecifica = useCallback(
    (configEspecifica: ConfigEspecificaTipoSeparacao) => {
      marcarConfigManual();
      setConfig((prev) => ({ ...prev, configEspecifica }));
    },
    [marcarConfigManual],
  );

  const atualizarCopias = useCallback((copias: number) => {
    marcarConfigManual();
    setConfig((prev) => ({
      ...prev,
      copias: Math.min(10, Math.max(1, copias)),
    }));
  }, [marcarConfigManual]);

  const atualizarFormatoPapel = useCallback((formatoPapel: FormatoPapel) => {
    marcarConfigManual();
    setConfig((prev) => ({ ...prev, formatoPapel }));
  }, [marcarConfigManual]);

  const atualizarOrdenacao = useCallback((ordenacao: OrdenacaoMapa) => {
    marcarConfigManual();
    setConfig((prev) => ({ ...prev, ordenacao }));
  }, [marcarConfigManual]);

  const atualizarItensPorFolha = useCallback((itensPorFolha: number) => {
    marcarConfigManual();
    setConfig((prev) => ({ ...prev, itensPorFolha }));
  }, [marcarConfigManual]);

  const toggleOperador = useCallback((operador: string) => {
    marcarConfigManual();
    setConfig((prev) => {
      const selecionado = prev.operadores.includes(operador);
      const operadores = selecionado
        ? prev.operadores.filter((nome) => nome !== operador)
        : [...prev.operadores, operador];

      return { ...prev, operadores };
    });
  }, [marcarConfigManual]);

  const toggleCampo = useCallback((campo: CampoMapa, ativo: boolean) => {
    marcarConfigManual();
    setConfig((prev) => {
      const campos = ativo
        ? [...new Set([...prev.campos, campo])]
        : prev.campos.filter((item) => item !== campo);

      return { ...prev, campos };
    });
  }, [marcarConfigManual]);

  const toggleMapaPorOperador = useCallback((ativo: boolean) => {
    marcarConfigManual();
    setConfig((prev) => ({ ...prev, mapaPorOperador: ativo }));
  }, [marcarConfigManual]);

  const atualizarTipoDestinoAlocacao = useCallback(
    (tipo: TipoDestinoAlocacao) => {
      marcarConfigManual();
      setConfig((prev) => ({
        ...prev,
        destinoAlocacao: { ...prev.destinoAlocacao, tipo },
      }));
    },
    [marcarConfigManual],
  );

  const atualizarReferenciaDestinoAlocacao = useCallback(
    (referencia: string) => {
      marcarConfigManual();
      setConfig((prev) => ({
        ...prev,
        destinoAlocacao: { ...prev.destinoAlocacao, referencia },
      }));
    },
    [marcarConfigManual],
  );

  const toggleDemandaEmpilhadeira = useCallback(
    (ativo: boolean) => {
      marcarConfigManual();
      setConfig((prev) => ({
        ...prev,
        destinoAlocacao: {
          ...prev.destinoAlocacao,
          gerarDemandaEmpilhadeira: ativo,
        },
      }));
    },
    [marcarConfigManual],
  );

  const selecionarModoInteligencia = useCallback((modo: ModoInteligencia) => {
    setModoInteligencia(modo);
    if (modo === 'manual') {
      setSugestaoInteligente(null);
    }
  }, []);

  const alterarQtdSeparadores = useCallback((qtd: number) => {
    setQtdSeparadores(Math.min(5, Math.max(1, qtd)));
  }, []);

  const selecionarMetaVelocidade = useCallback((meta: MetaVelocidade) => {
    setMetaVelocidade(meta);
  }, []);

  const gerarSugestaoInteligente = useCallback(() => {
    if (!transporteAtivo) {
      toast.error('Carregue um transporte para gerar sugestões.');
      return;
    }

    const sugestao = sugerirConfigInteligente(transporteAtivo, modoInteligencia, {
      qtdSeparadores,
      metaVelocidade,
    });

    if (!sugestao) {
      toast.error('Selecione um modo assistido para gerar a sugestão.');
      return;
    }

    setSugestaoInteligente(sugestao);
    toast.success(
      `Sugestão gerada: ${MODO_INTELIGENCIA_LABELS[sugestao.modo]}.`,
    );
  }, [metaVelocidade, modoInteligencia, qtdSeparadores, transporteAtivo]);

  const aplicarSugestaoInteligente = useCallback(() => {
    if (!sugestaoInteligente) {
      toast.error('Gere uma sugestão antes de aplicar.');
      return;
    }

    setConfig(sugestaoInteligente.config);
    setModoInteligencia(sugestaoInteligente.modo);
    toast.success('Configuração inteligente aplicada com sucesso.');
  }, [sugestaoInteligente]);

  const abrirPreview = useCallback(() => {
    if (!transporteAtivo) {
      toast.error('Carregue um transporte antes de pré-visualizar.');
      return;
    }

    if (!config.operadores.length) {
      toast.error('Selecione ao menos um operador.');
      return;
    }

    setPreviewAberto(true);
  }, [config.operadores.length, transporteAtivo]);

  const fecharPreview = useCallback(() => {
    setPreviewAberto(false);
  }, []);

  const imprimirMapas = useCallback(async () => {
    if (!transporteAtivo || !resultado) {
      toast.error('Carregue um transporte antes de imprimir.');
      return;
    }

    if (!config.operadores.length) {
      toast.error('Selecione ao menos um operador.');
      return;
    }

    setImprimindo(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setImprimindo(false);
    const msgDemandas =
      resultado.totalDemandasEmpilhadeira > 0
        ? ` · ${resultado.totalDemandasEmpilhadeira} demanda(s) de empilhadeira`
        : '';

    toast.success(
      `${resultado.totalFolhas} folha(s) · ${resultado.totalMapas} mapa(s)${msgDemandas} — ${TIPO_SEPARACAO_LABELS[config.tipoSeparacao]}.`,
    );
  }, [config.tipoSeparacao, config.operadores.length, resultado, transporteAtivo]);

  const imprimirPreview = useCallback(() => {
    const preview = document.getElementById('preview-mapa-separacao');
    if (!preview) {
      return;
    }

    const janela = window.open('', '_blank');
    if (!janela) {
      toast.error('Não foi possível abrir a janela de impressão.');
      return;
    }

    janela.document.write(`
      <html>
        <head>
          <title>Mapa de Separação</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 20px; color: #111; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
            th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
            th { background: #f4f4f5; }
            .bloco { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
            h3 { margin: 0 0 4px; font-size: 14px; }
            p.meta { margin: 0 0 8px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>${preview.innerHTML}</body>
      </html>
    `);
    janela.document.close();
    janela.print();
  }, []);

  const cancelar = useCallback(() => {
    router.push('/transporte');
  }, [router]);

  return {
    busca,
    setBusca,
    transporteAtivo,
    transportes,
    sugestoes,
    config,
    resultado,
    resumo,
    tagsConfiguracao,
    previewAberto,
    imprimindo,
    modoInteligencia,
    qtdSeparadores,
    metaVelocidade,
    sugestaoInteligente,
    carregarTransporte,
    selecionarTipoSeparacao,
    atualizarConfigEspecifica,
    atualizarCopias,
    atualizarFormatoPapel,
    atualizarOrdenacao,
    atualizarItensPorFolha,
    toggleOperador,
    toggleCampo,
    toggleMapaPorOperador,
    atualizarTipoDestinoAlocacao,
    atualizarReferenciaDestinoAlocacao,
    toggleDemandaEmpilhadeira,
    selecionarModoInteligencia,
    alterarQtdSeparadores,
    selecionarMetaVelocidade,
    gerarSugestaoInteligente,
    aplicarSugestaoInteligente,
    abrirPreview,
    fecharPreview,
    imprimirMapas,
    imprimirPreview,
    cancelar,
  };
}
