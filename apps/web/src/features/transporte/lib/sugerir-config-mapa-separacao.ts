import { gerarItensSeparacaoTransporte } from '@/features/transporte/lib/gerar-itens-separacao';
import { montarMapasSeparacao } from '@/features/transporte/lib/montar-mapas-separacao';
import {
  criarConfigEspecifica,
  DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO,
  DEFAULT_DESTINO_ALOCACAO,
  META_VELOCIDADE_LABELS,
  MODO_INTELIGENCIA_LABELS,
  OPERADORES_DISPONIVEIS,
  TIPO_SEPARACAO_LABELS,
  type ConfigImpressaoMapaSeparacao,
  type MetaVelocidade,
  type ModoInteligencia,
  type SugestaoInteligente,
  type TipoSeparacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const TIPOS_SEPARACAO: TipoSeparacao[] = [
  'discreto',
  'zona',
  'onda',
  'cluster',
  'corredor',
  'produto',
  'rota',
  'endereco',
];

const ITENS_POR_OPERADOR_META: Record<MetaVelocidade, number> = {
  urgente: 35,
  rapido: 50,
  balanceado: 65,
  cuidadoso: 40,
};

const TIPO_POR_VELOCIDADE: Record<MetaVelocidade, TipoSeparacao> = {
  urgente: 'produto',
  rapido: 'cluster',
  balanceado: 'zona',
  cuidadoso: 'discreto',
};

type ContextoTransporte = {
  totalPedidos: number;
  totalItens: number;
  zonasDistintas: number;
  skusDistintos: number;
  setoresEntrega: number;
};

function analisarTransporte(transporte: TransporteGrupo): ContextoTransporte {
  const itens = gerarItensSeparacaoTransporte(transporte);

  return {
    totalPedidos: transporte.quantidadeRemessas,
    totalItens: itens.length,
    zonasDistintas: new Set(itens.map((item) => item.zona)).size,
    skusDistintos: new Set(itens.map((item) => item.sku)).size,
    setoresEntrega: new Set(itens.map((item) => item.rotaEntrega)).size,
  };
}

function selecionarOperadores(quantidade: number): string[] {
  const limite = Math.min(
    Math.max(1, quantidade),
    OPERADORES_DISPONIVEIS.length,
  );

  return [...OPERADORES_DISPONIVEIS].slice(0, limite);
}

function tipoPorQuantidadeOperadores(
  qtd: number,
  contexto: ContextoTransporte,
): TipoSeparacao {
  if (qtd <= 1) {
    return contexto.totalPedidos <= 4 ? 'discreto' : 'endereco';
  }

  if (qtd === 2) {
    return contexto.zonasDistintas >= 2 ? 'zona' : 'corredor';
  }

  if (qtd <= 4) {
    return contexto.totalPedidos >= 6 ? 'cluster' : 'onda';
  }

  if (contexto.skusDistintos <= contexto.totalItens * 0.45) {
    return 'produto';
  }

  return contexto.zonasDistintas >= 3 ? 'zona' : 'corredor';
}

function itensPorFolhaSugerido(
  itensPorOperador: number,
  meta?: MetaVelocidade,
): number {
  if (meta === 'cuidadoso' || itensPorOperador <= 30) {
    return 15;
  }

  if (meta === 'urgente' || itensPorOperador >= 80) {
    return 25;
  }

  if (itensPorOperador >= 55) {
    return 20;
  }

  return 15;
}

function ordenacaoSugerida(tipo: TipoSeparacao): ConfigImpressaoMapaSeparacao['ordenacao'] {
  switch (tipo) {
    case 'discreto':
    case 'onda':
    case 'cluster':
      return 'pedido';
    case 'produto':
      return 'peso';
    case 'rota':
      return 'volume';
    case 'endereco':
    case 'corredor':
    case 'zona':
    default:
      return 'endereco';
  }
}

function detectarMelhorTipo(contexto: ContextoTransporte): {
  tipo: TipoSeparacao;
  explicacoes: string[];
} {
  if (contexto.totalPedidos <= 3) {
    return {
      tipo: 'discreto',
      explicacoes: [
        'Poucos pedidos no transporte favorecem separação discreta.',
        'Cada operador conclui um pedido por vez com menor risco de troca.',
      ],
    };
  }

  if (contexto.skusDistintos <= Math.ceil(contexto.totalItens * 0.4)) {
    return {
      tipo: 'produto',
      explicacoes: [
        'Alta repetição de SKUs detectada entre os pedidos.',
        'Separação por produto reduz idas ao mesmo endereço.',
      ],
    };
  }

  if (contexto.zonasDistintas >= 3 && contexto.totalPedidos >= 6) {
    return {
      tipo: 'zona',
      explicacoes: [
        `${contexto.zonasDistintas} zonas distintas no armazém.`,
        'Distribuição por zona evita cruzamento de operadores.',
      ],
    };
  }

  if (contexto.setoresEntrega >= 3) {
    return {
      tipo: 'rota',
      explicacoes: [
        `${contexto.setoresEntrega} setores de entrega no transporte.`,
        'Agrupar por rota alinha separação com a expedição.',
      ],
    };
  }

  if (contexto.totalPedidos >= 8) {
    return {
      tipo: 'onda',
      explicacoes: [
        'Volume de pedidos alto para liberação em ondas.',
        'Ondas mantêm ritmo sem sobrecarregar um único operador.',
      ],
    };
  }

  return {
    tipo: 'corredor',
    explicacoes: [
      'Perfil intermediário: rota por corredor minimiza deslocamento.',
      'Boa opção quando há variedade moderada de pedidos e zonas.',
    ],
  };
}

function calcularQtdOperadoresIdeal(
  contexto: ContextoTransporte,
  meta: MetaVelocidade,
): number {
  const alvo = ITENS_POR_OPERADOR_META[meta];
  const calculado = Math.ceil(contexto.totalItens / alvo);
  return Math.min(Math.max(1, calculado), OPERADORES_DISPONIVEIS.length);
}

function montarConfigBase(
  transporte: TransporteGrupo,
  parcial: Partial<ConfigImpressaoMapaSeparacao>,
): ConfigImpressaoMapaSeparacao {
  const tipoSeparacao =
    parcial.tipoSeparacao ?? DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO.tipoSeparacao;

  return {
    ...DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO,
    destinoAlocacao: {
      ...DEFAULT_DESTINO_ALOCACAO,
      referencia: transporte.veiculoAlocado?.placa
        ? `DOCA-${transporte.regiao}`
        : DEFAULT_DESTINO_ALOCACAO.referencia,
    },
    ...parcial,
    configEspecifica:
      parcial.configEspecifica ?? criarConfigEspecifica(tipoSeparacao),
  };
}

function avaliarCenarios(
  transporte: TransporteGrupo,
  criterio: 'tempo' | 'papel',
): SugestaoInteligente {
  let melhor: SugestaoInteligente | null = null;
  let melhorPontuacao = Infinity;
  const quantidades = [1, 2, 3, 4, 5];

  for (const tipo of TIPOS_SEPARACAO) {
    for (const qtdOps of quantidades) {
      for (const itensFolha of [15, 20, 25] as const) {
        const config = montarConfigBase(transporte, {
          tipoSeparacao: tipo,
          operadores: selecionarOperadores(qtdOps),
          mapaPorOperador: qtdOps > 1,
          itensPorFolha: itensFolha,
          ordenacao: ordenacaoSugerida(tipo),
          copias: 1,
          formatoPapel: criterio === 'papel' ? 'a5' : 'a4',
          campos: ['barcode', 'peso', 'destino'],
        });

        const resultado = montarMapasSeparacao(transporte, config);
        const pontuacao =
          criterio === 'tempo'
            ? resultado.tempoMinutos
            : resultado.totalFolhas;

        if (pontuacao < melhorPontuacao) {
          melhorPontuacao = pontuacao;
          melhor = {
            config,
            explicacoes:
              criterio === 'tempo'
                ? [
                    `Melhor tempo estimado: ${resultado.tempoMinutos} min.`,
                    `${TIPO_SEPARACAO_LABELS[tipo]} com ${qtdOps} operador(es).`,
                    `${resultado.totalMapas} mapa(s) e ${resultado.totalFolhas} folha(s).`,
                  ]
                : [
                    `Menor consumo de papel: ${resultado.totalFolhas} folha(s).`,
                    `${TIPO_SEPARACAO_LABELS[tipo]} com ${itensFolha} itens por folha.`,
                    `Formato ${config.formatoPapel.toUpperCase()} para reduzir impressão.`,
                  ],
            confianca: 'alta',
            modo: criterio === 'tempo' ? 'minimizar_tempo' : 'minimizar_papel',
          };
        }
      }
    }
  }

  return (
    melhor ?? {
      config: DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO,
      explicacoes: ['Não foi possível calcular um cenário otimizado.'],
      confianca: 'baixa',
      modo: criterio === 'tempo' ? 'minimizar_tempo' : 'minimizar_papel',
    }
  );
}

export function sugerirPorQuantidadeSeparadores(
  transporte: TransporteGrupo,
  quantidade: number,
): SugestaoInteligente {
  const contexto = analisarTransporte(transporte);
  const qtd = Math.min(Math.max(1, quantidade), OPERADORES_DISPONIVEIS.length);
  const tipo = tipoPorQuantidadeOperadores(qtd, contexto);
  const operadores = selecionarOperadores(qtd);
  const itensPorOperador = Math.ceil(contexto.totalItens / qtd);

  const config = montarConfigBase(transporte, {
    tipoSeparacao: tipo,
    operadores,
    mapaPorOperador: qtd > 1,
    itensPorFolha: itensPorFolhaSugerido(itensPorOperador),
    ordenacao: ordenacaoSugerida(tipo),
    copias: 1,
    campos: ['barcode', 'peso', 'volume', 'destino'],
  });

  const resultado = montarMapasSeparacao(transporte, config);

  return {
    config,
    explicacoes: [
      `${qtd} separador(es) selecionado(s): ${operadores.join(', ')}.`,
      `Tipo recomendado: ${TIPO_SEPARACAO_LABELS[tipo]} para ${contexto.totalItens} SKU(s).`,
      `Carga média de ${Math.ceil(contexto.totalItens / qtd)} itens por operador.`,
      `Estimativa: ${resultado.totalMapas} mapa(s), ${resultado.tempoMinutos} min.`,
    ],
    confianca: qtd <= OPERADORES_DISPONIVEIS.length ? 'alta' : 'media',
    modo: 'qtd_separadores',
  };
}

export function sugerirPorMetaVelocidade(
  transporte: TransporteGrupo,
  meta: MetaVelocidade,
): SugestaoInteligente {
  const contexto = analisarTransporte(transporte);
  const qtd = calcularQtdOperadoresIdeal(contexto, meta);
  const tipo =
    meta === 'balanceado'
      ? detectarMelhorTipo(contexto).tipo
      : TIPO_POR_VELOCIDADE[meta];
  const operadores = selecionarOperadores(qtd);
  const itensPorOperador = Math.ceil(contexto.totalItens / qtd);

  const config = montarConfigBase(transporte, {
    tipoSeparacao: tipo,
    operadores,
    mapaPorOperador: qtd > 1,
    itensPorFolha: itensPorFolhaSugerido(itensPorOperador, meta),
    ordenacao: ordenacaoSugerida(tipo),
    copias: 1,
    formatoPapel: meta === 'urgente' ? 'a5' : 'a4',
    campos:
      meta === 'cuidadoso'
        ? ['barcode', 'peso', 'volume', 'destino', 'observacoes']
        : ['barcode', 'peso', 'destino'],
  });

  const resultado = montarMapasSeparacao(transporte, config);

  return {
    config,
    explicacoes: [
      `Meta "${META_VELOCIDADE_LABELS[meta]}" aplicada ao transporte.`,
      `${qtd} operador(es) para manter ~${ITENS_POR_OPERADOR_META[meta]} itens por pessoa.`,
      `Estratégia: ${TIPO_SEPARACAO_LABELS[tipo]}.`,
      `Tempo estimado: ${resultado.tempoMinutos} min · ${resultado.totalFolhas} folha(s).`,
    ],
    confianca: 'alta',
    modo: 'meta_velocidade',
  };
}

export function sugerirBalancearCarga(
  transporte: TransporteGrupo,
): SugestaoInteligente {
  const contexto = analisarTransporte(transporte);
  const qtd = Math.min(
    Math.max(2, Math.ceil(contexto.totalItens / 55)),
    OPERADORES_DISPONIVEIS.length,
  );
  const tipo = contexto.zonasDistintas >= qtd ? 'zona' : 'corredor';
  const operadores = selecionarOperadores(qtd);

  const config = montarConfigBase(transporte, {
    tipoSeparacao: tipo,
    operadores,
    mapaPorOperador: true,
    itensPorFolha: 20,
    ordenacao: 'endereco',
    copias: 1,
    campos: ['barcode', 'peso', 'volume', 'destino'],
  });

  const resultado = montarMapasSeparacao(transporte, config);
  const cargaMedia = Math.ceil(contexto.totalItens / qtd);

  return {
    config,
    explicacoes: [
      'Distribuição uniforme entre separadores disponíveis.',
      `${qtd} operador(es) com carga média de ${cargaMedia} itens.`,
      `${TIPO_SEPARACAO_LABELS[tipo]} para reduzir sobreposição de rotas.`,
      `${resultado.totalMapas} mapa(s) gerados com divisão equilibrada.`,
    ],
    confianca: 'alta',
    modo: 'balancear_carga',
  };
}

export function sugerirAutoTipo(transporte: TransporteGrupo): SugestaoInteligente {
  const contexto = analisarTransporte(transporte);
  const { tipo, explicacoes } = detectarMelhorTipo(contexto);
  const qtd = Math.min(
    Math.max(1, Math.ceil(contexto.totalItens / 60)),
    OPERADORES_DISPONIVEIS.length,
  );

  const config = montarConfigBase(transporte, {
    tipoSeparacao: tipo,
    operadores: selecionarOperadores(qtd),
    mapaPorOperador: qtd > 1,
    itensPorFolha: itensPorFolhaSugerido(Math.ceil(contexto.totalItens / qtd)),
    ordenacao: ordenacaoSugerida(tipo),
    copias: 1,
    campos: ['barcode', 'peso', 'volume', 'destino'],
  });

  const resultado = montarMapasSeparacao(transporte, config);

  return {
    config,
    explicacoes: [
      ...explicacoes,
      `${qtd} operador(es) sugerido(s) para o perfil detectado.`,
      `Resultado: ${resultado.totalMapas} mapa(s) em ~${resultado.tempoMinutos} min.`,
    ],
    confianca: 'alta',
    modo: 'auto_tipo',
  };
}

export function sugerirConfigInteligente(
  transporte: TransporteGrupo,
  modo: ModoInteligencia,
  opcoes?: {
    qtdSeparadores?: number;
    metaVelocidade?: MetaVelocidade;
  },
): SugestaoInteligente | null {
  switch (modo) {
    case 'qtd_separadores':
      if (!opcoes?.qtdSeparadores) {
        return null;
      }
      return sugerirPorQuantidadeSeparadores(
        transporte,
        opcoes.qtdSeparadores,
      );
    case 'meta_velocidade':
      if (!opcoes?.metaVelocidade) {
        return null;
      }
      return sugerirPorMetaVelocidade(transporte, opcoes.metaVelocidade);
    case 'balancear_carga':
      return sugerirBalancearCarga(transporte);
    case 'minimizar_tempo':
      return avaliarCenarios(transporte, 'tempo');
    case 'minimizar_papel':
      return avaliarCenarios(transporte, 'papel');
    case 'auto_tipo':
      return sugerirAutoTipo(transporte);
    case 'manual':
    default:
      return null;
  }
}

export function obterTituloModoInteligencia(modo: ModoInteligencia): string {
  return MODO_INTELIGENCIA_LABELS[modo];
}
