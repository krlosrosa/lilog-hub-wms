'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { listarConfiguracoesImpressao } from '@/features/expedicao-impressao-config/lib/configuracao-impressao-api';
import { listTransportes } from '@/features/transporte/lib/expedicao-api';
import {
  deleteMapaLoteApi,
  gerarMapasApi,
  salvarMapasApi,
  toConfigMapaImpressaoApi,
  type GerarMapasResponse,
  type MapaLoteResumo,
} from '@/features/transporte/lib/gerar-mapas-api';
import { mapConfiguracaoImpressaoToPreConfiguracao } from '@/features/transporte/lib/map-configuracao-impressao-to-mapa';
import { mapTransportesApiToGrupos } from '@/features/transporte/lib/map-transporte-api';
import {
  montarResumoMapaLotePreview,
  transportesComMapaAnterior,
} from '@/features/transporte/lib/montar-resumo-mapa-lote-preview';
import { montarBlocosMapa } from '@/features/transporte/lib/montar-blocos-mapa';
import {
  loadMapaSelecao,
  loadMapaTransportes,
  saveMapaImpressaoPayload,
  saveMapaSelecao,
  saveMapaTransportes,
} from '@/features/transporte/storage/mapa-impressao-storage';
import type {
  AgrupamentoMapa,
  BlocoMapaImpressao,
  ConfigMapaImpressao,
  FaixaFifo,
  GrupoMapaCustomizado,
  TipoQuebraPalete,
  TipoDadosBasicosMapa,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';
import {
  DEFAULT_CONFIG_MAPA_IMPRESSAO,
  type PreConfiguracaoMapa,
} from '@/features/transporte/types/transporte.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';
import {
  buildTorreControleExpedicaoHref,
  resolverUploadLoteIdTransportes,
} from '@/features/torre-controle-expedicao/lib/torre-controle-routes';
import {
  criarIntervaloPadraoHoje,
  normalizarIntervaloData,
} from '@/features/torre-controle-expedicao/lib/intervalo-data';

export function useGerarMapas() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const [transportesSelecionados, setTransportesSelecionados] = useState<
    TransporteGrupo[]
  >([]);
  const [config, setConfig] = useState<ConfigMapaImpressao>(
    DEFAULT_CONFIG_MAPA_IMPRESSAO,
  );
  const [preConfiguracoes, setPreConfiguracoes] = useState<PreConfiguracaoMapa[]>(
    [],
  );
  const [preConfiguracaoId, setPreConfiguracaoId] = useState<string | null>(null);
  const [inicializado, setInicializado] = useState(false);
  const [carregandoConfigs, setCarregandoConfigs] = useState(false);
  const [gerandoMapas, setGerandoMapas] = useState(false);
  const [salvandoMapas, setSalvandoMapas] = useState(false);
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false);
  const [mapaLoteSalvoId, setMapaLoteSalvoId] = useState<string | null>(null);
  const [excluindoMapaLoteId, setExcluindoMapaLoteId] = useState<string | null>(
    null,
  );
  const [gruposGerados, setGruposGerados] = useState<GerarMapasResponse | null>(
    null,
  );

  const atualizarConfig = useCallback(
    (updater: (prev: ConfigMapaImpressao) => ConfigMapaImpressao) => {
      setPreConfiguracaoId(null);
      setGruposGerados(null);
      setMapaLoteSalvoId(null);
      setConfig((prev) => updater(prev));
    },
    [],
  );

  useEffect(() => {
    if (!unidadeSelecionada?.id) {
      setTransportesSelecionados(loadMapaTransportes());
      setInicializado(true);
      return;
    }

    let ativo = true;

    async function carregarTransportes() {
      const unidadeId = unidadeSelecionada!.id;
      const idsSelecionados = loadMapaSelecao();
      const cache = loadMapaTransportes();

      try {
        const response = await listTransportes(unidadeId);
        const todos = mapTransportesApiToGrupos(response.transportes);
        const ids =
          idsSelecionados.length > 0
            ? idsSelecionados
            : cache.map((transporte) => transporte.id);
        const idsSet = new Set(ids);
        const selecionados = todos.filter((transporte) => idsSet.has(transporte.id));

        if (!ativo) {
          return;
        }

        const resultado = selecionados.length > 0 ? selecionados : cache;
        setTransportesSelecionados(resultado);

        if (selecionados.length > 0) {
          saveMapaTransportes(selecionados);
        }
      } catch (error) {
        if (!ativo) {
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar os itens dos transportes.';

        toast.error(message);
        setTransportesSelecionados(cache);
      } finally {
        if (ativo) {
          setInicializado(true);
        }
      }
    }

    void carregarTransportes();

    return () => {
      ativo = false;
    };
  }, [unidadeSelecionada?.id]);

  useEffect(() => {
    if (!unidadeSelecionada?.id) {
      return;
    }

    let ativo = true;

    async function carregarConfiguracoes() {
      const unidadeId = unidadeSelecionada!.id;
      setCarregandoConfigs(true);

      try {
        const response = await listarConfiguracoesImpressao(unidadeId);
        const mapeadas = response.items.map(mapConfiguracaoImpressaoToPreConfiguracao);

        if (!ativo) {
          return;
        }

        setPreConfiguracoes(mapeadas);

        if (mapeadas.length === 0) {
          setPreConfiguracaoId(null);
          return;
        }

        const padraoItem =
          response.items.find((item) => item.isPadrao) ?? response.items[0]!;
        const padrao =
          mapeadas.find((item) => item.id === padraoItem.id) ?? mapeadas[0]!;

        setConfig({ ...padrao.config });
        setPreConfiguracaoId(padrao.id);
      } catch (error) {
        if (!ativo) {
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar as configurações de impressão.';

        toast.error(message);
        setPreConfiguracoes([]);
        setPreConfiguracaoId(null);
      } finally {
        if (ativo) {
          setCarregandoConfigs(false);
        }
      }
    }

    void carregarConfiguracoes();

    return () => {
      ativo = false;
    };
  }, [unidadeSelecionada?.id]);

  const blocosPreview = useMemo<BlocoMapaImpressao[]>(() => {
    if (!transportesSelecionados.length) {
      return [];
    }

    return montarBlocosMapa(transportesSelecionados, config);
  }, [config, transportesSelecionados]);

  const uploadLoteIdTorre = useMemo(
    () => resolverUploadLoteIdTransportes(transportesSelecionados),
    [transportesSelecionados],
  );

  const torreControleHref = useMemo(() => {
    if (!uploadLoteIdTorre || !unidadeSelecionada?.id) {
      return null;
    }

    const datas = [
      ...new Set(
        transportesSelecionados
          .map((transporte) => transporte.dataTransporte)
          .filter(Boolean),
      ),
    ].sort();

    const intervalo =
      datas.length > 0
        ? normalizarIntervaloData({
            dataInicio: datas[0]!,
            dataFim: datas.at(-1)!,
          })
        : criarIntervaloPadraoHoje();

    return buildTorreControleExpedicaoHref(
      uploadLoteIdTorre,
      unidadeSelecionada.id,
      intervalo,
    );
  }, [transportesSelecionados, unidadeSelecionada?.id, uploadLoteIdTorre]);

  const removerTransporte = useCallback((id: string) => {
    setGruposGerados(null);
    setMapaLoteSalvoId(null);
    setTransportesSelecionados((prev) => {
      const next = prev.filter((transporte) => transporte.id !== id);
      saveMapaSelecao(next.map((transporte) => transporte.id));
      saveMapaTransportes(next);
      return next;
    });
  }, []);

  const atualizarUsarQuebraPalete = useCallback((ativo: boolean) => {
    atualizarConfig((prev) => ({
      ...prev,
      quebraPalete: { ...prev.quebraPalete, ativo },
    }));
  }, [atualizarConfig]);

  const atualizarQuebraTipo = useCallback((tipo: TipoQuebraPalete) => {
    atualizarConfig((prev) => ({
      ...prev,
      quebraPalete: { ...prev.quebraPalete, tipo },
    }));
  }, [atualizarConfig]);

  const atualizarQuebraValor = useCallback((valor: number) => {
    atualizarConfig((prev) => ({
      ...prev,
      quebraPalete: {
        ...prev.quebraPalete,
        valor: Number.isFinite(valor) ? Math.max(0, valor) : 0,
      },
    }));
  }, [atualizarConfig]);

  const atualizarTipoDadosBasicos = useCallback(
    (tipoDadosBasicos: TipoDadosBasicosMapa) => {
      atualizarConfig((prev) => ({
        ...prev,
        tipoDadosBasicos,
        exibirClienteCabecalho:
          tipoDadosBasicos === 'cliente' ? true : prev.exibirClienteCabecalho,
      }));
    },
    [atualizarConfig],
  );

  const atualizarCheckbox = useCallback(
    (
      campo: keyof Pick<
        ConfigMapaImpressao,
        | 'segregarPaleteFull'
        | 'segregarUnidade'
        | 'segregarFifo'
        | 'exibirClienteCabecalho'
      >,
      valor: boolean,
    ) => {
      atualizarConfig((prev) => {
        if (campo === 'segregarFifo' && !valor) {
          return { ...prev, segregarFifo: false, faixasFifo: [] };
        }

        return { ...prev, [campo]: valor };
      });
    },
    [atualizarConfig],
  );

  const toggleFaixaFifo = useCallback((faixa: FaixaFifo) => {
    atualizarConfig((prev) => {
      const selecionada = prev.faixasFifo.includes(faixa);
      const faixasFifo = selecionada
        ? prev.faixasFifo.filter((item) => item !== faixa)
        : [...prev.faixasFifo, faixa];

      return { ...prev, faixasFifo };
    });
  }, [atualizarConfig]);

  const toggleTipoAgrupamento = useCallback((tipo: AgrupamentoMapa) => {
    atualizarConfig((prev) => {
      const ativo = prev.agrupamento.tiposAtivos.includes(tipo);
      const tiposAtivos = ativo
        ? prev.agrupamento.tiposAtivos.filter((item) => item !== tipo)
        : [...prev.agrupamento.tiposAtivos, tipo];

      const agrupamento = { ...prev.agrupamento, tiposAtivos };

      if (tipo === 'segregar_clientes' && ativo) {
        agrupamento.clientesSegregados = [];
      }

      if (tipo === 'grupos_customizados' && ativo) {
        agrupamento.grupos = [];
      }

      return { ...prev, agrupamento };
    });
  }, [atualizarConfig]);

  const adicionarClienteSegregado = useCallback((codCliente: string) => {
    const codigo = codCliente.trim();
    if (!codigo) {
      return;
    }

    atualizarConfig((prev) => {
      if (prev.agrupamento.clientesSegregados.includes(codigo)) {
        return prev;
      }

      return {
        ...prev,
        agrupamento: {
          ...prev.agrupamento,
          clientesSegregados: [...prev.agrupamento.clientesSegregados, codigo],
        },
      };
    });
  }, [atualizarConfig]);

  const removerClienteSegregado = useCallback((codCliente: string) => {
    atualizarConfig((prev) => ({
      ...prev,
      agrupamento: {
        ...prev.agrupamento,
        clientesSegregados: prev.agrupamento.clientesSegregados.filter(
          (item) => item !== codCliente,
        ),
      },
    }));
  }, [atualizarConfig]);

  const adicionarGrupo = useCallback(() => {
    atualizarConfig((prev) => {
      const novoGrupo: GrupoMapaCustomizado = {
        id: `grupo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: '',
        tipoItem: 'transporte',
        itens: [],
      };

      return {
        ...prev,
        agrupamento: {
          ...prev.agrupamento,
          tiposAtivos: prev.agrupamento.tiposAtivos.includes('grupos_customizados')
            ? prev.agrupamento.tiposAtivos
            : [...prev.agrupamento.tiposAtivos, 'grupos_customizados'],
          grupos: [...prev.agrupamento.grupos, novoGrupo],
        },
      };
    });
  }, [atualizarConfig]);

  const removerGrupo = useCallback((grupoId: string) => {
    atualizarConfig((prev) => ({
      ...prev,
      agrupamento: {
        ...prev.agrupamento,
        grupos: prev.agrupamento.grupos.filter((grupo) => grupo.id !== grupoId),
      },
    }));
  }, [atualizarConfig]);

  const atualizarGrupo = useCallback(
    (
      grupoId: string,
      dados: Partial<Pick<GrupoMapaCustomizado, 'nome' | 'tipoItem'>>,
    ) => {
      atualizarConfig((prev) => ({
        ...prev,
        agrupamento: {
          ...prev.agrupamento,
          grupos: prev.agrupamento.grupos.map((grupo) => {
            if (grupo.id !== grupoId) {
              return grupo;
            }

            const tipoItemAlterado =
              dados.tipoItem !== undefined && dados.tipoItem !== grupo.tipoItem;

            return {
              ...grupo,
              ...dados,
              itens: tipoItemAlterado ? [] : grupo.itens,
            };
          }),
        },
      }));
    },
    [atualizarConfig],
  );

  const adicionarItemGrupo = useCallback((grupoId: string, itemId: string) => {
    atualizarConfig((prev) => ({
      ...prev,
      agrupamento: {
        ...prev.agrupamento,
        grupos: prev.agrupamento.grupos.map((grupo) =>
          grupo.id === grupoId && !grupo.itens.includes(itemId)
            ? { ...grupo, itens: [...grupo.itens, itemId] }
            : grupo,
        ),
      },
    }));
  }, [atualizarConfig]);

  const removerItemGrupo = useCallback((grupoId: string, itemId: string) => {
    atualizarConfig((prev) => ({
      ...prev,
      agrupamento: {
        ...prev.agrupamento,
        grupos: prev.agrupamento.grupos.map((grupo) =>
          grupo.id === grupoId
            ? {
                ...grupo,
                itens: grupo.itens.filter((item) => item !== itemId),
              }
            : grupo,
        ),
      },
    }));
  }, [atualizarConfig]);

  const aplicarPreConfiguracao = useCallback(
    (id: string | null) => {
      if (!id) {
        setPreConfiguracaoId(null);
        return;
      }

      const preConfiguracao = preConfiguracoes.find((opcao) => opcao.id === id);
      if (!preConfiguracao) {
        return;
      }

      setGruposGerados(null);
      setMapaLoteSalvoId(null);
      setConfig({ ...preConfiguracao.config });
      setPreConfiguracaoId(id);
      toast.success(`Pré-configuração "${preConfiguracao.nome}" aplicada.`);
    },
    [preConfiguracoes],
  );

  const voltar = useCallback(() => {
    router.back();
  }, [router]);

  const gerarMapas = useCallback(async (): Promise<boolean> => {
    if (!transportesSelecionados.length) {
      toast.error('Selecione ao menos um transporte para gerar os mapas.');
      return false;
    }

    if (!unidadeSelecionada?.id) {
      toast.error('Selecione uma unidade para gerar os mapas.');
      return false;
    }

    setGerandoMapas(true);

    try {
      const ids = transportesSelecionados.map((transporte) => transporte.id);
      const response = await gerarMapasApi(unidadeSelecionada.id, {
        transporteIds: ids,
        config: toConfigMapaImpressaoApi(config),
      });

      setGruposGerados(response);
      setMapaLoteSalvoId(null);
      saveMapaTransportes(transportesSelecionados);
      saveMapaImpressaoPayload({ ids, config });
      saveMapaSelecao(ids);

      toast.success('JSON de grupos atualizado.');
      return true;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível gerar os mapas.';

      toast.error(message);
      return false;
    } finally {
      setGerandoMapas(false);
    }
  }, [config, transportesSelecionados, unidadeSelecionada?.id]);

  const resumoSalvarPreview = useMemo<MapaLoteResumo | null>(() => {
    if (!gruposGerados) {
      return null;
    }

    return montarResumoMapaLotePreview({
      gruposGerados,
      config,
      transportes: transportesSelecionados,
    });
  }, [config, gruposGerados, transportesSelecionados]);

  const transportesComMapaExistente = useMemo(
    () => transportesComMapaAnterior(transportesSelecionados),
    [transportesSelecionados],
  );

  const lotesMapaConflitantes = useMemo(() => {
    const porLote = new Map<
      string,
      { loteId: string; transportes: TransporteGrupo[] }
    >();

    for (const transporte of transportesComMapaExistente) {
      const loteId = transporte.ultimoMapaLoteId;

      if (!loteId) {
        continue;
      }

      const atual = porLote.get(loteId) ?? { loteId, transportes: [] };
      atual.transportes.push(transporte);
      porLote.set(loteId, atual);
    }

    return [...porLote.values()];
  }, [transportesComMapaExistente]);

  const transportesSubstituicao = transportesComMapaExistente;

  const podeSalvar =
    gruposGerados != null &&
    gruposGerados.totalGrupos > 0 &&
    transportesComMapaExistente.length === 0 &&
    !gerandoMapas &&
    !salvandoMapas;

  const abrirModalSalvar = useCallback(() => {
    if (!podeSalvar) {
      return;
    }

    setModalSalvarAberto(true);
  }, [podeSalvar]);

  const fecharModalSalvar = useCallback(() => {
    if (salvandoMapas) {
      return;
    }

    setModalSalvarAberto(false);
  }, [salvandoMapas]);

  const atualizarTransportesAposSalvar = useCallback(async () => {
    if (!unidadeSelecionada?.id) {
      return;
    }

    try {
      const response = await listTransportes(unidadeSelecionada.id);
      const todos = mapTransportesApiToGrupos(response.transportes);
      const idsSet = new Set(transportesSelecionados.map((item) => item.id));
      const atualizados = todos.filter((transporte) => idsSet.has(transporte.id));

      if (atualizados.length > 0) {
        setTransportesSelecionados(atualizados);
        saveMapaTransportes(atualizados);
      }
    } catch {
      // Falha silenciosa no refresh — o salvamento já foi concluído.
    }
  }, [transportesSelecionados, unidadeSelecionada?.id]);

  const salvarMapas = useCallback(async (): Promise<boolean> => {
    if (!podeSalvar || !unidadeSelecionada?.id) {
      toast.error('Gere os mapas antes de salvar.');
      return false;
    }

    setSalvandoMapas(true);

    try {
      const ids = transportesSelecionados.map((transporte) => transporte.id);
      const payload = {
        transporteIds: ids,
        config: toConfigMapaImpressaoApi(config),
        ...(preConfiguracaoId ? { configuracaoImpressaoId: preConfiguracaoId } : {}),
      };

      const response = await salvarMapasApi(unidadeSelecionada.id, payload);

      setMapaLoteSalvoId(response.mapaLoteId);
      setGruposGerados(response);
      setModalSalvarAberto(false);
      await atualizarTransportesAposSalvar();

      toast.success('Mapas salvos com sucesso.');
      return true;
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar os mapas.';

      toast.error(message);
      return false;
    } finally {
      setSalvandoMapas(false);
    }
  }, [
    atualizarTransportesAposSalvar,
    config,
    podeSalvar,
    preConfiguracaoId,
    transportesSelecionados,
    unidadeSelecionada?.id,
  ]);

  const excluirMapaLote = useCallback(
    async (loteId: string): Promise<boolean> => {
      if (!unidadeSelecionada?.id) {
        toast.error('Selecione uma unidade para excluir o mapa.');
        return false;
      }

      setExcluindoMapaLoteId(loteId);

      try {
        const resultado = await deleteMapaLoteApi(loteId, unidadeSelecionada.id);
        setGruposGerados(null);
        setMapaLoteSalvoId(null);
        await atualizarTransportesAposSalvar();

        toast.success('Mapa excluído.', {
          description: `${resultado.transportesAfetados} transporte${resultado.transportesAfetados !== 1 ? 's' : ''} liberado${resultado.transportesAfetados !== 1 ? 's' : ''} para novo salvamento.`,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir o mapa.';

        toast.error(message);
        return false;
      } finally {
        setExcluindoMapaLoteId(null);
      }
    },
    [atualizarTransportesAposSalvar, unidadeSelecionada?.id],
  );

  return {
    transportesSelecionados,
    blocosPreview,
    gruposGerados,
    config,
    preConfiguracoes,
    preConfiguracaoId,
    carregandoConfigs,
    gerandoMapas,
    salvandoMapas,
    mapaLoteSalvoId,
    uploadLoteIdTorre,
    torreControleHref,
    modalSalvarAberto,
    resumoSalvarPreview,
    transportesSubstituicao,
    transportesComMapaExistente,
    lotesMapaConflitantes,
    excluindoMapaLoteId,
    podeSalvar,
    inicializado,
    removerTransporte,
    aplicarPreConfiguracao,
    atualizarUsarQuebraPalete,
    atualizarQuebraTipo,
    atualizarQuebraValor,
    atualizarTipoDadosBasicos,
    atualizarCheckbox,
    toggleFaixaFifo,
    toggleTipoAgrupamento,
    adicionarClienteSegregado,
    removerClienteSegregado,
    adicionarGrupo,
    removerGrupo,
    atualizarGrupo,
    adicionarItemGrupo,
    removerItemGrupo,
    voltar,
    gerarMapas,
    abrirModalSalvar,
    fecharModalSalvar,
    salvarMapas,
    excluirMapaLote,
  };
}
