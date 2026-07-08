import type {
  AcaoRegra,
  ArvoreCondicoes,
  CampoCondicao,
  CondicaoFolha,
  GrupoCondicoes,
  NoCondicao,
  OperadorCondicao,
} from '../../../domain/model/regra-processo/regra-processo.model.js';

export type EngineConditionLeaf = {
  fact: string;
  operator: string;
  value: unknown;
  path?: string;
};

export type EngineTopLevelCondition =
  | { all: EngineNestedCondition[] }
  | { any: EngineNestedCondition[] }
  | { not: EngineNestedCondition };

export type EngineNestedCondition =
  | EngineConditionLeaf
  | EngineTopLevelCondition;

export type EngineRule = {
  name?: string;
  priority?: number;
  conditions: EngineTopLevelCondition;
  event: {
    type: string;
    params?: Record<string, unknown>;
  };
};

type FactDefinition = {
  fact: string;
  path?: string;
  valueType: 'string' | 'number' | 'date' | 'enum';
};

const FACT_CATALOG: Record<CampoCondicao, FactDefinition> = {
  categoria_produto: { fact: 'produto', path: '$.categoria', valueType: 'enum' },
  subcategoria_produto: {
    fact: 'produto',
    path: '$.subcategoria',
    valueType: 'string',
  },
  fornecedor: { fact: 'produto', path: '$.fornecedor', valueType: 'string' },
  peso: { fact: 'produto', path: '$.pesoKg', valueType: 'number' },
  volume: { fact: 'produto', path: '$.volumeM3', valueType: 'number' },
  dias_producao: { fact: 'produto', path: '$.diasProducao', valueType: 'number' },
  dias_validade: { fact: 'produto', path: '$.diasValidade', valueType: 'number' },
  data_recebimento: {
    fact: 'recebimento',
    path: '$.dataRecebimento',
    valueType: 'date',
  },
  quantidade_estoque: {
    fact: 'estoque',
    path: '$.quantidade',
    valueType: 'number',
  },
  nivel_minimo: { fact: 'estoque', path: '$.nivelMinimo', valueType: 'number' },
  tipo_endereco: { fact: 'endereco', path: '$.tipo', valueType: 'enum' },
  zona_temperatura: {
    fact: 'endereco',
    path: '$.zonaTemperatura',
    valueType: 'enum',
  },
  situacao_produto: { fact: 'produto', path: '$.situacao', valueType: 'enum' },
  tipo_divergencia: {
    fact: 'produto',
    path: '$.tipoDivergencia',
    valueType: 'enum',
  },
  grupo_produto: { fact: 'produto', path: '$.grupo', valueType: 'string' },
  produto_id: { fact: 'produto', path: '$.produtoId', valueType: 'string' },
  shelf_life: { fact: 'produto', path: '$.shelfLife', valueType: 'number' },
  percentual_validade_restante: {
    fact: 'produto',
    path: '$.percentualValidadeRestante',
    valueType: 'number',
  },
};

const OPERATOR_TO_ENGINE: Partial<Record<OperadorCondicao, string>> = {
  igual: 'equal',
  diferente: 'notEqual',
  maior_que: 'greaterThan',
  menor_que: 'lessThan',
  esta_em: 'in',
  contem: 'contains',
};

export const CUSTOM_OPERATORS = {
  stringContains: 'stringContains',
} as const;

function parseValor(campo: CampoCondicao, valor: string): unknown {
  const def = FACT_CATALOG[campo];
  if (def.valueType === 'number') {
    return Number(valor);
  }
  return valor;
}

function folhaToEngineLeaf(folha: CondicaoFolha): EngineNestedCondition[] {
  const { fact, path } = FACT_CATALOG[folha.campo];
  const value = parseValor(folha.campo, folha.valor);

  if (folha.operador === 'entre') {
    return [
      {
        fact,
        path,
        operator: 'greaterThanInclusive',
        value: parseValor(folha.campo, folha.valor),
      },
      {
        fact,
        path,
        operator: 'lessThanInclusive',
        value: parseValor(folha.campo, folha.valorFim ?? ''),
      },
    ];
  }

  if (folha.operador === 'esta_em') {
    return [
      {
        fact,
        path,
        operator: 'in',
        value: folha.valor.split(',').map((item) => item.trim()),
      },
    ];
  }

  if (
    folha.operador === 'contem' &&
    FACT_CATALOG[folha.campo].valueType === 'string'
  ) {
    return [
      {
        fact,
        path,
        operator: CUSTOM_OPERATORS.stringContains,
        value,
      },
    ];
  }

  const engineOp = OPERATOR_TO_ENGINE[folha.operador];
  if (!engineOp) {
    throw new Error(`Operador não mapeado: ${folha.operador}`);
  }

  return [{ fact, path, operator: engineOp, value }];
}

function noToEngineConditions(no: NoCondicao): EngineNestedCondition[] {
  if (no.tipo === 'condicao') {
    return folhaToEngineLeaf(no);
  }

  const grupo = no as GrupoCondicoes;
  const filhosEngine = grupo.filhos.flatMap((filho) => {
    const converted = noToEngineConditions(filho);
    if (converted.length === 1) {
      return converted;
    }
    return [{ all: converted }];
  });

  if (grupo.operador === 'not') {
    const alvo = filhosEngine[0];
    if (!alvo) {
      throw new Error('Grupo NOT precisa de exatamente um filho');
    }
    return [{ not: alvo }];
  }

  if (grupo.operador === 'all') {
    return [{ all: filhosEngine }];
  }

  return [{ any: filhosEngine }];
}

export function arvoreToEngineConditions(
  arvore: ArvoreCondicoes,
): EngineTopLevelCondition {
  const nos = arvore.filhos.flatMap((filho) => noToEngineConditions(filho));

  if (arvore.operador === 'not') {
    const alvo = nos[0];
    if (!alvo) {
      throw new Error('Raiz NOT precisa de exatamente um filho');
    }
    return { not: alvo };
  }

  if (arvore.operador === 'all') {
    return { all: nos };
  }

  return { any: nos };
}

export function acaoToEngineEvent(acao: AcaoRegra): EngineRule['event'] {
  return {
    type: acao.tipo,
    params: { ...acao.parametros },
  };
}

export function regraProcessoToEngineRule(input: {
  nome: string;
  prioridade: number;
  arvoreCondicoes: ArvoreCondicoes;
  acoes: AcaoRegra[];
}): EngineRule {
  const [acao] = input.acoes;
  if (!acao) {
    throw new Error('Regra precisa de ao menos uma ação');
  }

  return {
    name: input.nome,
    priority: input.prioridade,
    conditions: arvoreToEngineConditions(input.arvoreCondicoes),
    event: acaoToEngineEvent(acao),
  };
}
