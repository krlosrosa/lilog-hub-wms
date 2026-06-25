import type { Acao, CampoCondicao, Condicao, OperadorCondicao, RegraWms } from '@/features/regras-wms/types/regra-wms.schema';
import type {
  EngineNestedCondition,
  EngineRule,
  EngineTopLevelCondition,
} from '@/features/regras-wms/types/regra-wms-engine.schema';
import type {
  ArvoreCondicoes,
  CondicaoFolha,
  GrupoCondicoes,
  GrupoOperador,
  NoCondicao,
  RegraWmsV2,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

// ---------------------------------------------------------------------------
// Catálogo de Facts WMS
// ---------------------------------------------------------------------------

export type FactValueType = 'string' | 'number' | 'date' | 'enum';

export type FactDefinition = {
  /** Nome do fact registrado na engine (payload do evento WMS). */
  fact: string;
  /** JSONPath para propriedade aninhada (jsonpath-plus). */
  path?: string;
  valueType: FactValueType;
};

/**
 * Mapeia campos da UI → `{ fact, path }` da json-rules-engine.
 * Facts agrupados por contexto reduzem registros na engine.
 */
export const FACT_CATALOG: Record<CampoCondicao, FactDefinition> = {
  categoria_produto: { fact: 'produto', path: '$.categoria', valueType: 'enum' },
  subcategoria_produto: { fact: 'produto', path: '$.subcategoria', valueType: 'string' },
  fornecedor: { fact: 'produto', path: '$.fornecedor', valueType: 'string' },
  peso: { fact: 'produto', path: '$.pesoKg', valueType: 'number' },
  volume: { fact: 'produto', path: '$.volumeM3', valueType: 'number' },
  dias_producao: { fact: 'produto', path: '$.diasProducao', valueType: 'number' },
  dias_validade: { fact: 'produto', path: '$.diasValidade', valueType: 'number' },
  data_recebimento: { fact: 'recebimento', path: '$.dataRecebimento', valueType: 'date' },
  quantidade_estoque: { fact: 'estoque', path: '$.quantidade', valueType: 'number' },
  nivel_minimo: { fact: 'estoque', path: '$.nivelMinimo', valueType: 'number' },
  tipo_endereco: { fact: 'endereco', path: '$.tipo', valueType: 'enum' },
  zona_temperatura: { fact: 'endereco', path: '$.zonaTemperatura', valueType: 'enum' },
  situacao_produto: { fact: 'produto', path: '$.situacao', valueType: 'enum' },
};

// ---------------------------------------------------------------------------
// Mapeamento de operadores UI ↔ json-rules-engine
// ---------------------------------------------------------------------------

/** Operadores nativos da json-rules-engine usados pelo conversor. */
export type EngineOperator =
  | 'equal'
  | 'notEqual'
  | 'lessThan'
  | 'lessThanInclusive'
  | 'greaterThan'
  | 'greaterThanInclusive'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'doesNotContain';

/**
 * Operadores simples (1:1).
 * `entre` e `contem` (string) exigem tratamento especial — ver funções abaixo.
 */
export const OPERATOR_TO_ENGINE: Partial<Record<OperadorCondicao, EngineOperator>> = {
  igual: 'equal',
  diferente: 'notEqual',
  maior_que: 'greaterThan',
  menor_que: 'lessThan',
  esta_em: 'in',
  contem: 'contains',
};

/** Operador UI que expande em sub-árvore `all` com dois nós. */
export const OPERATOR_ENTRE_EXPANDS_TO: readonly EngineOperator[] = [
  'greaterThanInclusive',
  'lessThanInclusive',
] as const;

/**
 * `contem` em facts string (não-array) requer operador customizado na engine.
 * Registrar no backend: `engine.addOperator('stringContains', ...)`
 */
export const CUSTOM_OPERATORS = {
  stringContains: 'stringContains',
} as const;

// ---------------------------------------------------------------------------
// Conversor: UI tree → Engine JSON
// ---------------------------------------------------------------------------

function parseValor(campo: CampoCondicao, valor: string): unknown {
  const def = FACT_CATALOG[campo];
  if (def.valueType === 'number') return Number(valor);
  if (def.valueType === 'date') return valor;
  return valor;
}

function folhaToEngineLeaf(folha: CondicaoFolha): EngineNestedCondition[] {
  const { fact, path } = FACT_CATALOG[folha.campo];
  const value = parseValor(folha.campo, folha.valor);

  if (folha.operador === 'entre') {
    const valorFim = folha.valorFim ?? '';
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
        value: parseValor(folha.campo, valorFim),
      },
    ];
  }

  if (folha.operador === 'esta_em') {
    return [
      {
        fact,
        path,
        operator: 'in',
        value: folha.valor.split(',').map((v) => v.trim()),
      },
    ];
  }

  if (folha.operador === 'contem' && FACT_CATALOG[folha.campo].valueType === 'string') {
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

  const filhosEngine = no.filhos.flatMap((f) => {
    const converted = noToEngineConditions(f);
    if (converted.length === 1) return converted;
    return [{ all: converted }];
  });

  if (no.operador === 'not') {
    const alvo = filhosEngine[0];
    if (!alvo) throw new Error('Grupo NOT precisa de exatamente um filho');
    return [{ not: alvo }];
  }

  if (no.operador === 'all') return [{ all: filhosEngine }];
  return [{ any: filhosEngine }];
}

export function arvoreToEngineConditions(
  arvore: ArvoreCondicoes,
): EngineTopLevelCondition {
  const nos = arvore.filhos.flatMap((f) => noToEngineConditions(f));

  if (arvore.operador === 'not') {
    const alvo = nos[0];
    if (!alvo) throw new Error('Raiz NOT precisa de exatamente um filho');
    return { not: alvo };
  }

  if (arvore.operador === 'all') return { all: nos };
  return { any: nos };
}

export function acaoToEngineEvent(acao: Acao): EngineRule['event'] {
  return {
    type: acao.tipo,
    params: { ...acao.parametros },
  };
}

/** Converte regra UI v2 → formato nativo json-rules-engine. */
export function regraV2ToEngineRule(regra: Pick<RegraWmsV2, 'nome' | 'prioridade' | 'arvoreCondicoes' | 'acao'>): EngineRule {
  return {
    name: regra.nome,
    priority: regra.prioridade,
    conditions: arvoreToEngineConditions(regra.arvoreCondicoes),
    event: acaoToEngineEvent(regra.acao),
  };
}

// ---------------------------------------------------------------------------
// Migrador: modelo flat legado → árvore v2
// ---------------------------------------------------------------------------

/** Converte lista plana (modelo atual) → árvore com um único grupo na raiz. */
export function flatCondicoesToArvore(
  operadorLogico: 'AND' | 'OR',
  condicoes: Condicao[],
): ArvoreCondicoes {
  return {
    operador: operadorLogico === 'AND' ? 'all' : 'any',
    filhos: condicoes.map((c) => ({
      tipo: 'condicao' as const,
      id: c.id,
      campo: c.campo,
      operador: c.operador,
      valor: c.valor,
      valorFim: c.valorFim,
    })),
  };
}

export function regraLegacyToV2(regra: RegraWms): RegraWmsV2 {
  return {
    id: regra.id,
    nome: regra.nome,
    descricao: regra.descricao,
    ativo: regra.ativo,
    prioridade: regra.prioridade,
    gatilho: regra.gatilho,
    arvoreCondicoes: flatCondicoesToArvore(regra.operadorLogico, regra.condicoes),
    acao: regra.acao,
    criadoEm: regra.criadoEm,
    atualizadoEm: regra.atualizadoEm,
  };
}

// ---------------------------------------------------------------------------
// Exemplo documentado — rw-001 com subgrupo (caso futuro)
// ---------------------------------------------------------------------------

/**
 * Exemplo de árvore com subgrupo OR aninhado:
 *
 * (dias_validade < 30 AND situacao = integro)
 *   OR
 * (categoria = laticinios AND dias_producao > 5)
 *
 * ```ts
 * const arvore: ArvoreCondicoes = {
 *   operador: 'any',
 *   filhos: [
 *     {
 *       tipo: 'grupo', id: 'g1', operador: 'all',
 *       filhos: [
 *         { tipo: 'condicao', id: 'c1', campo: 'dias_validade', operador: 'menor_que', valor: '30' },
 *         { tipo: 'condicao', id: 'c2', campo: 'situacao_produto', operador: 'igual', valor: 'integro' },
 *       ],
 *     },
 *     {
 *       tipo: 'grupo', id: 'g2', operador: 'all',
 *       filhos: [
 *         { tipo: 'condicao', id: 'c3', campo: 'categoria_produto', operador: 'igual', valor: 'laticinios' },
 *         { tipo: 'condicao', id: 'c4', campo: 'dias_producao', operador: 'maior_que', valor: '5' },
 *       ],
 *     },
 *   ],
 * };
 * ```
 *
 * Engine JSON resultante:
 * ```json
 * {
 *   "conditions": {
 *     "any": [
 *       { "all": [
 *         { "fact": "produto", "path": "$.diasValidade", "operator": "lessThan", "value": 30 },
 *         { "fact": "produto", "path": "$.situacao", "operator": "equal", "value": "integro" }
 *       ]},
 *       { "all": [
 *         { "fact": "produto", "path": "$.categoria", "operator": "equal", "value": "laticinios" },
 *         { "fact": "produto", "path": "$.diasProducao", "operator": "greaterThan", "value": 5 }
 *       ]}
 *     ]
 *   },
 *   "event": { "type": "quarentena", "params": { "zonaDestino": "Quarentena" } },
 *   "priority": 90
 * }
 * ```
 */

export type RegraWmsConverter = {
  toEngineRule: typeof regraV2ToEngineRule;
  legacyToV2: typeof regraLegacyToV2;
  flatToArvore: typeof flatCondicoesToArvore;
};

export const regraWmsConverter: RegraWmsConverter = {
  toEngineRule: regraV2ToEngineRule,
  legacyToV2: regraLegacyToV2,
  flatToArvore: flatCondicoesToArvore,
};
