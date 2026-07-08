'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import {
  atualizarConfiguracaoImpressao,
  criarConfiguracaoImpressao,
  deletarConfiguracaoImpressao,
  definirPadraoConfiguracaoImpressao,
  listarConfiguracoesImpressao,
} from '@/features/expedicao-impressao-config/lib/configuracao-impressao-api';
import {
  extrairConteudoConfig,
  validarConfigImpressao,
} from '@/features/expedicao-impressao-config/lib/validar-config-impressao';
import { DEFAULT_IMPRESSAO_CONFIG } from '@/features/expedicao-impressao-config/mocks/impressao-config.mock';
import {
  DEFAULT_OPCOES_TABELAS_CARREGAMENTO,
  TABELA_CARREGAMENTO_TIPO_LABELS,
  type OrdemTabelaClientesItem,
  type OrdemTabelaEmpresaItem,
  type TabelaCarregamentoTipo,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import {
  mapApiToPreConfiguracao,
  splitConfigForApi,
} from '@/features/expedicao-impressao-config/types/configuracao-impressao.api';
import type {
  AgrupamentoConferencia,
  ClassificarPorConferencia,
  FaixaFifo,
  ImpressaoConfig,
  OrdemImpressaoContext,
  OrdemImpressaoItem,
  PosicaoQrCode,
  PreConfiguracaoImpressao,
  TipoDadosBasicos,
  TipoQuebra,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { ORDEM_IMPRESSAO_CONTEXT_LABELS } from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import type { TipoLayoutMapa } from '@/features/expedicao-impressao-config/types/layout-mapa';
import { ApiClientError } from '@/lib/api';

const ORDEM_FIELD_BY_CONTEXT = {
  separacao: 'ordemImpressaoSeparacao',
  conferencia: 'ordemImpressaoConferencia',
  conferencia_reentrega: 'ordemImpressaoConferenciaReentrega',
} as const satisfies Record<
  OrdemImpressaoContext,
  | 'ordemImpressaoSeparacao'
  | 'ordemImpressaoConferencia'
  | 'ordemImpressaoConferenciaReentrega'
>;

function swapOrdemItems<T>(
  ordem: T[],
  indexA: number,
  indexB: number,
): T[] | null {
  const itemA = ordem[indexA];
  const itemB = ordem[indexB];

  if (!itemA || !itemB) return null;

  const next = [...ordem];
  next[indexA] = itemB;
  next[indexB] = itemA;
  return next;
}

const ORDEM_CARREGAMENTO_FIELD_BY_TIPO = {
  empresa: 'ordemTabelaEmpresa',
  clientes: 'ordemTabelaClientes',
} as const satisfies Record<
  TabelaCarregamentoTipo,
  'ordemTabelaEmpresa' | 'ordemTabelaClientes'
>;

const EXIBIR_CARREGAMENTO_FIELD_BY_TIPO = {
  empresa: 'exibirTabelaEmpresa',
  clientes: 'exibirTabelaClientes',
} as const satisfies Record<
  TabelaCarregamentoTipo,
  'exibirTabelaEmpresa' | 'exibirTabelaClientes'
>;

function mesclarComContexto(
  base: ImpressaoConfig,
  conteudo: PreConfiguracaoImpressao['config'],
): ImpressaoConfig {
  const layoutCabecalho = {
    ...DEFAULT_IMPRESSAO_CONFIG.layoutCabecalho,
    ...conteudo.layoutCabecalho,
    conferencia_reentrega:
      conteudo.layoutCabecalho?.conferencia_reentrega ??
      DEFAULT_IMPRESSAO_CONFIG.layoutCabecalho.conferencia_reentrega,
  };

  const qrCodeMapa = {
    ...DEFAULT_IMPRESSAO_CONFIG.qrCodeMapa,
    ...conteudo.qrCodeMapa,
    conferencia_reentrega:
      conteudo.qrCodeMapa?.conferencia_reentrega ??
      conteudo.qrCodeMapa?.conferencia ??
      DEFAULT_IMPRESSAO_CONFIG.qrCodeMapa.conferencia_reentrega,
  };

  return {
    centroId: base.centroId,
    centroNome: base.centroNome,
    nomeCentroSistema: base.nomeCentroSistema,
    usuarioId: base.usuarioId,
    ...conteudo,
    layoutCabecalho,
    qrCodeMapa,
    ordemImpressaoConferenciaReentrega:
      conteudo.ordemImpressaoConferenciaReentrega ??
      conteudo.ordemImpressaoConferencia ??
      DEFAULT_IMPRESSAO_CONFIG.ordemImpressaoConferenciaReentrega,
    opcoesTabelasCarregamento: {
      ...DEFAULT_OPCOES_TABELAS_CARREGAMENTO,
      ...conteudo.opcoesTabelasCarregamento,
    },
    opcoesSeparacao: {
      ...DEFAULT_IMPRESSAO_CONFIG.opcoesSeparacao,
      ...conteudo.opcoesSeparacao,
    },
    tipoDadosBasicos:
      conteudo.tipoDadosBasicos ?? DEFAULT_IMPRESSAO_CONFIG.tipoDadosBasicos,
  };
}

function erroApi(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
}

type UseImpressaoConfigOptions = {
  unidadeId: string;
};

export function useImpressaoConfig({ unidadeId }: UseImpressaoConfigOptions) {
  const [config, setConfig] = useState<ImpressaoConfig>(() =>
    structuredClone(DEFAULT_IMPRESSAO_CONFIG),
  );
  const [configuracoesSalvas, setConfiguracoesSalvas] = useState<
    PreConfiguracaoImpressao[]
  >([]);
  const [configuracaoSalvaId, setConfiguracaoSalvaId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalSalvarComoAberto, setModalSalvarComoAberto] = useState(false);

  const carregarConfiguracoes = useCallback(async () => {
    const response = await listarConfiguracoesImpressao(unidadeId);
    const itens = response.items.map(mapApiToPreConfiguracao);
    setConfiguracoesSalvas(itens);
    return itens;
  }, [unidadeId]);

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      setIsLoading(true);

      try {
        const itens = await carregarConfiguracoes();
        if (!ativo) return;

        const padrao = itens.find((item) => item.isPadrao);

        if (padrao) {
          setConfig((current) => mesclarComContexto(current, padrao.config));
          setConfiguracaoSalvaId(padrao.id);
        }
      } catch (error) {
        if (!ativo) return;

        toast.error(
          erroApi(error, 'Não foi possível carregar as configurações salvas.'),
        );
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, [carregarConfiguracoes]);

  const atualizarConfig = useCallback(
    (updater: (prev: ImpressaoConfig) => ImpressaoConfig) => {
      setConfig(updater);
    },
    [],
  );

  const setTipoDadosBasicos = useCallback(
    (tipoDadosBasicos: TipoDadosBasicos) => {
      atualizarConfig((current) => ({ ...current, tipoDadosBasicos }));
    },
    [atualizarConfig],
  );

  const setQuebraPaleteAtiva = useCallback(
    (ativa: boolean) => {
      atualizarConfig((current) => ({
        ...current,
        quebraPalete: { ...current.quebraPalete, ativa },
      }));
    },
    [atualizarConfig],
  );

  const setTipoQuebra = useCallback(
    (tipo: TipoQuebra) => {
      atualizarConfig((current) => ({
        ...current,
        quebraPalete: { ...current.quebraPalete, tipo },
      }));
    },
    [atualizarConfig],
  );

  const setPercentualQuebra = useCallback(
    (percentual: number) => {
      atualizarConfig((current) => ({
        ...current,
        quebraPalete: {
          ...current.quebraPalete,
          percentual: Math.min(100, Math.max(0, percentual)),
        },
      }));
    },
    [atualizarConfig],
  );

  const setSepararPaletesCompletos = useCallback(
    (value: boolean) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesSeparacao: {
          ...current.opcoesSeparacao,
          separarPaletesCompletos: value,
        },
      }));
    },
    [atualizarConfig],
  );

  const setSepararUnidadesIndividuais = useCallback(
    (value: boolean) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesSeparacao: {
          ...current.opcoesSeparacao,
          separarUnidadesIndividuais: value,
        },
      }));
    },
    [atualizarConfig],
  );

  const setSegregarFifo = useCallback(
    (value: boolean) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesSeparacao: {
          ...current.opcoesSeparacao,
          segregarFifo: value,
          faixasFifo: value ? current.opcoesSeparacao.faixasFifo : [],
        },
      }));
    },
    [atualizarConfig],
  );

  const toggleFaixaFifo = useCallback(
    (faixa: FaixaFifo) => {
      atualizarConfig((current) => {
        const selecionada = current.opcoesSeparacao.faixasFifo.includes(faixa);
        const faixasFifo = selecionada
          ? current.opcoesSeparacao.faixasFifo.filter((item) => item !== faixa)
          : [...current.opcoesSeparacao.faixasFifo, faixa];

        return {
          ...current,
          opcoesSeparacao: { ...current.opcoesSeparacao, faixasFifo },
        };
      });
    },
    [atualizarConfig],
  );

  const setPercentualMaximoDataFifo = useCallback(
    (percentualMaximoDataFifo: number) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesSeparacao: {
          ...current.opcoesSeparacao,
          percentualMaximoDataFifo: Math.min(
            100,
            Math.max(0, percentualMaximoDataFifo),
          ),
        },
      }));
    },
    [atualizarConfig],
  );

  const setClassificarPorConferencia = useCallback(
    (classificarPor: ClassificarPorConferencia) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesConferencia: { ...current.opcoesConferencia, classificarPor },
      }));
    },
    [atualizarConfig],
  );

  const setAgrupamentoConferencia = useCallback(
    (agrupamento: AgrupamentoConferencia) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesConferencia: { ...current.opcoesConferencia, agrupamento },
      }));
    },
    [atualizarConfig],
  );

  const moveOrdemItemUp = useCallback(
    (context: OrdemImpressaoContext, index: number) => {
      if (index <= 0) return;

      atualizarConfig((current) => {
        const field = ORDEM_FIELD_BY_CONTEXT[context];
        const ordem = [...current[field]];
        const swapped = swapOrdemItems(ordem, index, index - 1);

        if (!swapped) return current;

        return { ...current, [field]: swapped };
      });
    },
    [atualizarConfig],
  );

  const moveOrdemItemDown = useCallback(
    (context: OrdemImpressaoContext, index: number) => {
      atualizarConfig((current) => {
        const field = ORDEM_FIELD_BY_CONTEXT[context];
        const ordem = [...current[field]];

        if (index >= ordem.length - 1) return current;

        const swapped = swapOrdemItems(ordem, index, index + 1);

        if (!swapped) return current;

        return { ...current, [field]: swapped };
      });
    },
    [atualizarConfig],
  );

  const toggleOrdemItem = useCallback(
    (context: OrdemImpressaoContext, item: OrdemImpressaoItem) => {
      atualizarConfig((current) => {
        const field = ORDEM_FIELD_BY_CONTEXT[context];
        const ordem = current[field];
        const isActive = ordem.includes(item);

        if (isActive) {
          if (ordem.length <= 1) {
            toast.error(
              `Mantenha ao menos um critério de ordenação ativo em ${ORDEM_IMPRESSAO_CONTEXT_LABELS[context]}.`,
            );
            return current;
          }

          return {
            ...current,
            [field]: ordem.filter((value) => value !== item),
          };
        }

        return {
          ...current,
          [field]: [...ordem, item],
        };
      });
    },
    [atualizarConfig],
  );

  const setLayoutCabecalho = useCallback(
    (tipo: TipoLayoutMapa, html: string) => {
      atualizarConfig((current) => ({
        ...current,
        layoutCabecalho: { ...current.layoutCabecalho, [tipo]: html },
      }));
    },
    [atualizarConfig],
  );

  const setQrCodePosicao = useCallback(
    (tipo: TipoLayoutMapa, posicao: PosicaoQrCode) => {
      atualizarConfig((current) => ({
        ...current,
        qrCodeMapa: {
          ...current.qrCodeMapa,
          [tipo]: { ...current.qrCodeMapa[tipo], posicao },
        },
      }));
    },
    [atualizarConfig],
  );

  const setQrCodeTamanho = useCallback(
    (tipo: TipoLayoutMapa, tamanho: number) => {
      atualizarConfig((current) => ({
        ...current,
        qrCodeMapa: {
          ...current.qrCodeMapa,
          [tipo]: {
            ...current.qrCodeMapa[tipo],
            tamanho: Math.min(160, Math.max(48, tamanho)),
          },
        },
      }));
    },
    [atualizarConfig],
  );

  const setExibirTabelaCarregamento = useCallback(
    (tipo: TabelaCarregamentoTipo, exibir: boolean) => {
      atualizarConfig((current) => ({
        ...current,
        opcoesTabelasCarregamento: {
          ...current.opcoesTabelasCarregamento,
          [EXIBIR_CARREGAMENTO_FIELD_BY_TIPO[tipo]]: exibir,
        },
      }));
    },
    [atualizarConfig],
  );

  const moveColunaCarregamentoUp = useCallback(
    (tipo: TabelaCarregamentoTipo, index: number) => {
      if (index <= 0) return;

      atualizarConfig((current) => {
        const field = ORDEM_CARREGAMENTO_FIELD_BY_TIPO[tipo];
        const ordem = [...current.opcoesTabelasCarregamento[field]];
        const swapped = swapOrdemItems(ordem, index, index - 1);

        if (!swapped) return current;

        return {
          ...current,
          opcoesTabelasCarregamento: {
            ...current.opcoesTabelasCarregamento,
            [field]: swapped,
          },
        };
      });
    },
    [atualizarConfig],
  );

  const moveColunaCarregamentoDown = useCallback(
    (tipo: TabelaCarregamentoTipo, index: number) => {
      atualizarConfig((current) => {
        const field = ORDEM_CARREGAMENTO_FIELD_BY_TIPO[tipo];
        const ordem = [...current.opcoesTabelasCarregamento[field]];

        if (index >= ordem.length - 1) return current;

        const swapped = swapOrdemItems(ordem, index, index + 1);

        if (!swapped) return current;

        return {
          ...current,
          opcoesTabelasCarregamento: {
            ...current.opcoesTabelasCarregamento,
            [field]: swapped,
          },
        };
      });
    },
    [atualizarConfig],
  );

  const toggleColunaCarregamento = useCallback(
    (
      tipo: TabelaCarregamentoTipo,
      coluna: OrdemTabelaEmpresaItem | OrdemTabelaClientesItem,
    ) => {
      atualizarConfig((current) => {
        const opcoes = current.opcoesTabelasCarregamento;
        const exibir = opcoes[EXIBIR_CARREGAMENTO_FIELD_BY_TIPO[tipo]];

        if (tipo === 'empresa') {
          const field = 'ordemTabelaEmpresa' as const;
          const ordem = opcoes[field];
          const item = coluna as OrdemTabelaEmpresaItem;
          const isActive = ordem.includes(item);

          if (isActive) {
            if (exibir && ordem.length <= 1) {
              toast.error(
                `Mantenha ao menos uma coluna ativa em ${TABELA_CARREGAMENTO_TIPO_LABELS.empresa}.`,
              );
              return current;
            }

            return {
              ...current,
              opcoesTabelasCarregamento: {
                ...opcoes,
                [field]: ordem.filter((value) => value !== item),
              },
            };
          }

          return {
            ...current,
            opcoesTabelasCarregamento: {
              ...opcoes,
              [field]: [...ordem, item],
            },
          };
        }

        const field = 'ordemTabelaClientes' as const;
        const ordem = opcoes[field];
        const item = coluna as OrdemTabelaClientesItem;
        const isActive = ordem.includes(item);

        if (isActive) {
          if (exibir && ordem.length <= 1) {
            toast.error(
              `Mantenha ao menos uma coluna ativa em ${TABELA_CARREGAMENTO_TIPO_LABELS.clientes}.`,
            );
            return current;
          }

          return {
            ...current,
            opcoesTabelasCarregamento: {
              ...opcoes,
              [field]: ordem.filter((value) => value !== item),
            },
          };
        }

        return {
          ...current,
          opcoesTabelasCarregamento: {
            ...opcoes,
            [field]: [...ordem, item],
          },
        };
      });
    },
    [atualizarConfig],
  );

  const aplicarConfiguracaoSalva = useCallback(
    (id: string | null) => {
      if (!id) {
        setConfiguracaoSalvaId(null);
        return;
      }

      const salva = configuracoesSalvas.find((item) => item.id === id);
      if (!salva) {
        toast.error('Configuração salva não encontrada.');
        return;
      }

      setConfig((current) => mesclarComContexto(current, salva.config));
      setConfiguracaoSalvaId(id);
      toast.success(`Configuração "${salva.nome}" carregada.`);
    },
    [configuracoesSalvas],
  );

  const limpar = useCallback(() => {
    setConfig(structuredClone(DEFAULT_IMPRESSAO_CONFIG));
    setConfiguracaoSalvaId(null);
    toast.message('Configurações restauradas para os valores padrão.');
  }, []);

  const executarSalvamento = useCallback(async () => {
    const erro = validarConfigImpressao(config);
    if (erro) {
      toast.error(erro);
      return false;
    }

    setIsSaving(true);

    try {
      const conteudo = extrairConteudoConfig(config);
      const { configuracao, templatesHtml } = splitConfigForApi(conteudo);

      if (configuracaoSalvaId) {
        const salva = configuracoesSalvas.find(
          (item) => item.id === configuracaoSalvaId,
        );

        await atualizarConfiguracaoImpressao(configuracaoSalvaId, {
          nome: salva?.nome,
          configuracao,
          templatesHtml,
        });
      } else {
        toast.error(
          'Selecione uma configuração salva ou use "Salvar como nova".',
        );
        return false;
      }

      await carregarConfiguracoes();
      return true;
    } catch (error) {
      toast.error(
        erroApi(error, 'Não foi possível salvar a configuração de impressão.'),
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [carregarConfiguracoes, config, configuracaoSalvaId, configuracoesSalvas]);

  const salvar = useCallback(async () => {
    const sucesso = await executarSalvamento();
    if (sucesso) {
      toast.success('Configuração de impressão salva com sucesso.');
    }
  }, [executarSalvamento]);

  const salvarComoNova = useCallback(
    async (nome: string) => {
      const nomeNormalizado = nome.trim();
      const nomeDuplicado = configuracoesSalvas.some(
        (item) => item.nome.toLowerCase() === nomeNormalizado.toLowerCase(),
      );

      if (nomeDuplicado) {
        toast.error('Já existe uma configuração com este nome.');
        return;
      }

      const erro = validarConfigImpressao(config);
      if (erro) {
        toast.error(erro);
        return;
      }

      setIsSaving(true);

      try {
        const conteudo = extrairConteudoConfig(config);
        const { configuracao, templatesHtml } = splitConfigForApi(conteudo);

        const criada = await criarConfiguracaoImpressao({
          unidadeId,
          nome: nomeNormalizado,
          configuracao,
          templatesHtml,
        });

        await carregarConfiguracoes();
        setConfiguracaoSalvaId(criada.id);
        setModalSalvarComoAberto(false);
        toast.success(`Configuração "${nomeNormalizado}" salva com sucesso.`);
      } catch (error) {
        toast.error(
          erroApi(error, 'Não foi possível salvar a nova configuração.'),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [carregarConfiguracoes, config, configuracoesSalvas, unidadeId],
  );

  const deletarConfiguracaoSalva = useCallback(
    async (id: string) => {
      setIsSaving(true);

      try {
        await deletarConfiguracaoImpressao(id);

        if (configuracaoSalvaId === id) {
          setConfiguracaoSalvaId(null);
        }

        await carregarConfiguracoes();
        toast.success('Configuração removida com sucesso.');
      } catch (error) {
        toast.error(
          erroApi(error, 'Não foi possível remover a configuração.'),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [carregarConfiguracoes, configuracaoSalvaId],
  );

  const definirComoPadrao = useCallback(
    async (id: string) => {
      setIsSaving(true);

      try {
        await definirPadraoConfiguracaoImpressao(id);
        await carregarConfiguracoes();
        setConfiguracaoSalvaId(id);
        toast.success('Configuração definida como padrão da unidade.');
      } catch (error) {
        toast.error(
          erroApi(error, 'Não foi possível definir a configuração como padrão.'),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [carregarConfiguracoes],
  );

  return {
    config,
    configuracoesSalvas,
    configuracaoSalvaId,
    isLoading,
    isSaving,
    modalSalvarComoAberto,
    setModalSalvarComoAberto,
    setTipoDadosBasicos,
    setQuebraPaleteAtiva,
    setTipoQuebra,
    setPercentualQuebra,
    setSepararPaletesCompletos,
    setSepararUnidadesIndividuais,
    setSegregarFifo,
    toggleFaixaFifo,
    setPercentualMaximoDataFifo,
    setClassificarPorConferencia,
    setAgrupamentoConferencia,
    moveOrdemItemUp,
    moveOrdemItemDown,
    toggleOrdemItem,
    setLayoutCabecalho,
    setQrCodePosicao,
    setQrCodeTamanho,
    setExibirTabelaCarregamento,
    moveColunaCarregamentoUp,
    moveColunaCarregamentoDown,
    toggleColunaCarregamento,
    aplicarConfiguracaoSalva,
    limpar,
    salvar,
    salvarComoNova,
    deletarConfiguracaoSalva,
    definirComoPadrao,
    recarregar: carregarConfiguracoes,
  };
}

export type UseImpressaoConfigReturn = ReturnType<typeof useImpressaoConfig>;
