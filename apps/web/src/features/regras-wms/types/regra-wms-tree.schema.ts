import { z } from 'zod';

import {
  acaoSchema,
  campoCondicaoSchema,
  gatilhoRegraSchema,
  operadorCondicaoSchema,
  type Acao,
  type CampoCondicao,
  type GatilhoRegra,
  type OperadorCondicao,
} from '@/features/regras-wms/types/regra-wms.schema';

/**
 * Operadores booleanos da árvore — espelham `all` / `any` / `not` da json-rules-engine.
 * - all  → todas as condições do grupo devem ser verdadeiras (AND)
 * - any  → ao menos uma condição deve ser verdadeira (OR)
 * - not  → nega o único filho (grupo ou condição folha)
 */
export const grupoOperadorSchema = z.enum(['all', 'any', 'not']);

export type GrupoOperador = z.infer<typeof grupoOperadorSchema>;

export const GRUPO_OPERADOR_LABELS: Record<GrupoOperador, string> = {
  all: 'E (todas)',
  any: 'OU (qualquer)',
  not: 'NÃO',
};

/** Folha da árvore — condição atômica editável na UI. */
export const condicaoFolhaSchema = z.object({
  tipo: z.literal('condicao'),
  id: z.string(),
  campo: campoCondicaoSchema,
  operador: operadorCondicaoSchema,
  valor: z.string().min(1, 'Informe o valor'),
  valorFim: z.string().optional(),
});

export type CondicaoFolha = z.infer<typeof condicaoFolhaSchema>;

/** Nó de grupo — pode conter folhas ou subgrupos (recursivo). */
export type GrupoCondicoes = {
  tipo: 'grupo';
  id: string;
  operador: GrupoOperador;
  filhos: NoCondicao[];
};

export type NoCondicao = CondicaoFolha | GrupoCondicoes;

/** Raiz da árvore — equivalente ao `conditions` da json-rules-engine. */
export type ArvoreCondicoes = {
  operador: GrupoOperador;
  filhos: NoCondicao[];
};

/** Schema recursivo Zod para a árvore de condições. */
export const noCondicaoSchema: z.ZodType<NoCondicao> = z.lazy(() =>
  z.union([
    condicaoFolhaSchema,
    z.object({
      tipo: z.literal('grupo'),
      id: z.string(),
      operador: grupoOperadorSchema,
      filhos: z
        .array(noCondicaoSchema)
        .min(1, 'Grupo precisa de ao menos um filho'),
    }),
  ]),
);

const arvoreCondicoesLazySchema: z.ZodType<ArvoreCondicoes> = z.lazy(() =>
  z.object({
    operador: grupoOperadorSchema,
    filhos: z
      .array(noCondicaoSchema)
      .min(1, 'Adicione ao menos uma condição'),
  }),
);

/** Raiz da árvore — tipagem explícita para compatibilidade com react-hook-form. */
export const arvoreCondicoesSchema = z.custom<ArvoreCondicoes>(
  (value) => arvoreCondicoesLazySchema.safeParse(value).success,
  'Árvore de condições inválida',
);

export type RegraWmsV2 = {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  prioridade: number;
  gatilho: GatilhoRegra;
  arvoreCondicoes: ArvoreCondicoes;
  acao: Acao;
  criadoEm: string;
  atualizadoEm: string;
};

/** Regra WMS v2 — modelo alinhado à engine, com árvore aninhada. */
export const regraWmsV2Schema = z.object({
  id: z.string(),
  nome: z.string().min(3),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  prioridade: z.number().int().min(1).max(100),
  gatilho: gatilhoRegraSchema,
  arvoreCondicoes: arvoreCondicoesSchema,
  acao: acaoSchema,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
}) satisfies z.ZodType<RegraWmsV2>;

export type RegraWmsV2Form = Omit<
  RegraWmsV2,
  'id' | 'criadoEm' | 'atualizadoEm'
>;

export const regraWmsV2FormSchema = regraWmsV2Schema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
}) satisfies z.ZodType<RegraWmsV2Form>;

export function createEmptyCondicaoFolha(
  overrides?: Partial<Pick<CondicaoFolha, 'campo' | 'operador' | 'valor'>>,
): CondicaoFolha {
  return {
    tipo: 'condicao',
    id: crypto.randomUUID(),
    campo: 'categoria_produto',
    operador: 'igual',
    valor: '',
    ...overrides,
  };
}

export function createGrupoCondicoes(
  operador: GrupoOperador = 'all',
  filhos?: NoCondicao[],
): GrupoCondicoes {
  return {
    tipo: 'grupo',
    id: crypto.randomUUID(),
    operador,
    filhos: filhos ?? [createEmptyCondicaoFolha()],
  };
}

export function createArvoreCondicoes(
  operador: GrupoOperador = 'all',
  filhos?: NoCondicao[],
): ArvoreCondicoes {
  return {
    operador,
    filhos: filhos ?? [createEmptyCondicaoFolha()],
  };
}

export const DEFAULT_REGRA_WMS_V2_FORM: RegraWmsV2Form = {
  nome: '',
  descricao: '',
  ativo: true,
  prioridade: 50,
  gatilho: 'recebimento',
  arvoreCondicoes: createArvoreCondicoes(),
  acao: {
    tipo: 'quarentena',
    parametros: { zonaDestino: 'Quarentena', motivo: '' },
  },
};
