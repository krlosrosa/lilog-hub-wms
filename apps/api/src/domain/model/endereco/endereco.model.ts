import { z } from 'zod';

import { ClusterSchema } from '../unidade/unidade.model.js';

export const ENDERECO_SEGMENTO_REGEX = /^[A-Za-z0-9-]+$/;

export const ENDERECO_CODIGO_REGEX =
  /^(?:[A-Z0-9-]{1,10}|[A-Z0-9-]{1,10} [A-Z0-9-]{1,10} [A-Z0-9-]{1,10} [A-Z0-9-]{1,10})$/;

export const ENDERECO_TIPOS_ESTRUTURADOS = ['picking', 'pulmao', 'aereo'] as const;

export type EnderecoTipoEstruturado =
  (typeof ENDERECO_TIPOS_ESTRUTURADOS)[number];

export const EnderecoTipoSchema = z.enum([
  'picking',
  'pulmao',
  'aereo',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'area_operacional',
]);

export type EnderecoTipo = z.infer<typeof EnderecoTipoSchema>;

export function isEnderecoTipoEstruturado(
  tipo: EnderecoTipo,
): tipo is EnderecoTipoEstruturado {
  return (ENDERECO_TIPOS_ESTRUTURADOS as readonly string[]).includes(tipo);
}

export const EnderecoStatusSchema = z.enum([
  'disponivel',
  'ocupado',
  'bloqueado',
  'inventario',
  'inativo',
]);

export type EnderecoStatus = z.infer<typeof EnderecoStatusSchema>;

export const ENDERECO_TIPOS_ESTRUTURA_RACK = [
  'porta-palete',
  'drive-in',
  'estante-dinamica',
  'flow-rack',
] as const;

export const ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL = [
  'piso',
  'staging',
  'area-delimitada',
  'patio',
] as const;

export const EnderecoTipoEstruturaSchema = z.enum([
  ...ENDERECO_TIPOS_ESTRUTURA_RACK,
  ...ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL,
]);

export type EnderecoTipoEstrutura = z.infer<typeof EnderecoTipoEstruturaSchema>;

export type EnderecoTipoEstruturaRack =
  (typeof ENDERECO_TIPOS_ESTRUTURA_RACK)[number];

export type EnderecoTipoEstruturaOperacional =
  (typeof ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL)[number];

export function isEnderecoTipoEstruturaRack(
  tipoEstrutura: EnderecoTipoEstrutura,
): tipoEstrutura is EnderecoTipoEstruturaRack {
  return (ENDERECO_TIPOS_ESTRUTURA_RACK as readonly string[]).includes(
    tipoEstrutura,
  );
}

export function isTipoEstruturaValidoParaEndereco(
  tipo: EnderecoTipo,
  tipoEstrutura: EnderecoTipoEstrutura,
): boolean {
  return isEnderecoTipoEstruturado(tipo)
    ? isEnderecoTipoEstruturaRack(tipoEstrutura)
    : !isEnderecoTipoEstruturaRack(tipoEstrutura);
}

export function getDefaultTipoEstrutura(tipo: EnderecoTipo): EnderecoTipoEstrutura {
  return isEnderecoTipoEstruturado(tipo) ? 'porta-palete' : 'piso';
}

export const CurvaAbcEnderecoSchema = z.enum(['A', 'B', 'C']);

export type CurvaAbcEndereco = z.infer<typeof CurvaAbcEnderecoSchema>;

export const EnderecoUnidadeSchema = z.object({
  id: z.string().min(1).max(50),
  nome: z.string(),
  cluster: ClusterSchema,
  nomeFilial: z.string(),
});

export type EnderecoUnidade = z.infer<typeof EnderecoUnidadeSchema>;

const enderecoEstruturaSegmentoSchema = z
  .string()
  .max(10)
  .regex(
    ENDERECO_SEGMENTO_REGEX,
    'Use apenas letras, números ou hífen',
  );

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

const enderecoEstruturaSegmentoOptionalSchema = z.preprocess(
  emptyStringToUndefined,
  enderecoEstruturaSegmentoSchema.optional(),
);

export const enderecoEstruturaFields = {
  zona: z.string().min(1).max(10),
  rua: enderecoEstruturaSegmentoOptionalSchema,
  posicao: enderecoEstruturaSegmentoOptionalSchema,
  nivel: enderecoEstruturaSegmentoOptionalSchema,
};

const enderecoEstruturaSegmentoRequiredSchema = enderecoEstruturaSegmentoSchema.min(
  1,
);

export const enderecoEstruturaFieldsStored = {
  zona: enderecoEstruturaFields.zona,
  rua: enderecoEstruturaSegmentoRequiredSchema,
  posicao: enderecoEstruturaSegmentoRequiredSchema,
  nivel: enderecoEstruturaSegmentoRequiredSchema,
};

const ENDERECO_DEFAULT_RUA = '000';
const ENDERECO_DEFAULT_POSICAO = '0000';
const ENDERECO_DEFAULT_NIVEL = '00';

function normalizeEnderecoSegmento(
  value: string | undefined,
  defaultValue: string,
  padLength: number,
): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return defaultValue;
  }

  return trimmed.padStart(padLength, '0');
}

function hasEnderecoEstruturaDetalhada(
  rua?: string,
  posicao?: string,
  nivel?: string,
): boolean {
  return [rua, posicao, nivel].some((value) => (value ?? '').trim() !== '');
}

export function buildEnderecoCodigo(
  zona: string,
  rua?: string,
  posicao?: string,
  nivel?: string,
): string {
  if (!hasEnderecoEstruturaDetalhada(rua, posicao, nivel)) {
    return zona.trim().toUpperCase();
  }

  const ruaNormalizada = normalizeEnderecoSegmento(
    rua,
    ENDERECO_DEFAULT_RUA,
    3,
  );
  const posicaoNormalizada = normalizeEnderecoSegmento(
    posicao,
    ENDERECO_DEFAULT_POSICAO,
    4,
  );
  const nivelNormalizado = normalizeEnderecoSegmento(
    nivel,
    ENDERECO_DEFAULT_NIVEL,
    2,
  );

  return `${zona.trim().toUpperCase()} ${ruaNormalizada} ${posicaoNormalizada} ${nivelNormalizado}`;
}

export function refineEnderecoEstruturaRequired(
  data: {
    tipo: EnderecoTipo;
    rua?: string;
    posicao?: string;
    nivel?: string;
    tipoEstrutura?: EnderecoTipoEstrutura;
  },
  ctx: z.RefinementCtx,
) {
  if (!isEnderecoTipoEstruturado(data.tipo)) {
    return;
  }

  const requiredFields = [
    { field: 'rua' as const, label: 'Rua' },
    { field: 'posicao' as const, label: 'Posição' },
    { field: 'nivel' as const, label: 'Nível' },
  ];

  for (const { field, label } of requiredFields) {
    if (!data[field]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} é obrigatório para endereços de picking/pulmão`,
        path: [field],
      });
    }
  }
}

function refineEnderecoTipoEstruturaCompativel(
  data: {
    tipo: EnderecoTipo;
    tipoEstrutura?: EnderecoTipoEstrutura;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.tipoEstrutura) {
    return;
  }

  if (!isTipoEstruturaValidoParaEndereco(data.tipo, data.tipoEstrutura)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: isEnderecoTipoEstruturado(data.tipo)
        ? 'Selecione uma estrutura de rack para picking/pulmão'
        : 'Selecione uma estrutura operacional para este tipo de endereço',
      path: ['tipoEstrutura'],
    });
  }
}

export const EnderecoSchema = z.object({
  id: z.uuid(),
  enderecoMascarado: z
    .string()
    .min(1)
    .regex(
      ENDERECO_CODIGO_REGEX,
      'Use o formato ZONA RUA POSICAO NIVEL (ex: A 001 0001 10)',
    ),
  unidadeId: z.string().min(1).max(50),
  unidade: EnderecoUnidadeSchema,
  ...enderecoEstruturaFieldsStored,
  tipo: EnderecoTipoSchema,
  status: EnderecoStatusSchema,
  tipoEstrutura: EnderecoTipoEstruturaSchema,
  larguraMm: z.number().int().positive(),
  alturaMm: z.number().int().positive(),
  profundidadeMm: z.number().int().positive(),
  cargaMaxKg: z.string(),
  capacidadeVolume: z.string().nullable(),
  prioridadePicking: z.number().int().nullable(),
  coordenadaX: z.string().nullable(),
  coordenadaY: z.string().nullable(),
  coordenadaZ: z.string().nullable(),
  observacao: z.string().nullable(),
  vinculoSkuFixo: z.boolean(),
  regraLoteUnico: z.boolean(),
  permiteMisturaValidade: z.boolean(),
  permiteFracionado: z.boolean(),
  curvaAbc: CurvaAbcEnderecoSchema,
  ocupacaoPercent: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Endereco = z.infer<typeof EnderecoSchema>;

export const STRUCTURAL_ENDERECO_FIELDS = [
  'unidadeId',
  'zona',
  'rua',
  'posicao',
  'nivel',
  'tipoEstrutura',
  'larguraMm',
  'alturaMm',
  'profundidadeMm',
] as const;

export type StructuralEnderecoField = (typeof STRUCTURAL_ENDERECO_FIELDS)[number];

export const CreateEnderecoBodySchema = z
  .object({
    unidadeId: z.string().min(1).max(50),
    ...enderecoEstruturaFields,
    tipo: EnderecoTipoSchema,
    tipoEstrutura: EnderecoTipoEstruturaSchema,
    larguraMm: z.number().int().positive(),
    alturaMm: z.number().int().positive(),
    profundidadeMm: z.number().int().positive(),
    cargaMaxKg: z.number().positive(),
    capacidadeVolume: z.number().positive().optional(),
    prioridadePicking: z.number().int().optional(),
    coordenadaX: z.number().optional(),
    coordenadaY: z.number().optional(),
    coordenadaZ: z.number().optional(),
    observacao: z.string().optional(),
    vinculoSkuFixo: z.boolean().default(false),
    regraLoteUnico: z.boolean().default(false),
    permiteMisturaValidade: z.boolean().default(false),
    permiteFracionado: z.boolean().default(false),
    curvaAbc: CurvaAbcEnderecoSchema.default('B'),
  })
  .superRefine((data, ctx) => {
    refineEnderecoEstruturaRequired(data, ctx);
    refineEnderecoTipoEstruturaCompativel(data, ctx);
  });

export const CreateEnderecoInputSchema = CreateEnderecoBodySchema.transform(
  (data) => {
    const rua = normalizeEnderecoSegmento(data.rua, ENDERECO_DEFAULT_RUA, 3);
    const posicao = normalizeEnderecoSegmento(
      data.posicao,
      ENDERECO_DEFAULT_POSICAO,
      4,
    );
    const nivel = normalizeEnderecoSegmento(
      data.nivel,
      ENDERECO_DEFAULT_NIVEL,
      2,
    );

    return {
      ...data,
      rua,
      posicao,
      nivel,
      enderecoMascarado: buildEnderecoCodigo(
        data.zona,
        data.rua,
        data.posicao,
        data.nivel,
      ),
    };
  },
);

export type CreateEnderecoInput = z.input<typeof CreateEnderecoInputSchema>;
export type CreateEnderecoData = z.output<typeof CreateEnderecoInputSchema>;

export const UpdateEnderecoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
  zona: enderecoEstruturaFields.zona.optional(),
  rua: enderecoEstruturaSegmentoOptionalSchema,
  posicao: enderecoEstruturaSegmentoOptionalSchema,
  nivel: enderecoEstruturaSegmentoOptionalSchema,
  tipo: EnderecoTipoSchema.optional(),
  tipoEstrutura: EnderecoTipoEstruturaSchema.optional(),
  larguraMm: z.number().int().positive().optional(),
  alturaMm: z.number().int().positive().optional(),
  profundidadeMm: z.number().int().positive().optional(),
  cargaMaxKg: z.number().positive().optional(),
  capacidadeVolume: z.number().positive().nullable().optional(),
  prioridadePicking: z.number().int().nullable().optional(),
  coordenadaX: z.number().nullable().optional(),
  coordenadaY: z.number().nullable().optional(),
  coordenadaZ: z.number().nullable().optional(),
  observacao: z.string().nullable().optional(),
  vinculoSkuFixo: z.boolean().optional(),
  regraLoteUnico: z.boolean().optional(),
  permiteMisturaValidade: z.boolean().optional(),
  permiteFracionado: z.boolean().optional(),
  curvaAbc: CurvaAbcEnderecoSchema.optional(),
  status: EnderecoStatusSchema.optional(),
  ocupacaoPercent: z.number().min(0).max(100).optional(),
  motivoAlteracao: z.string().min(1).optional(),
});

export type UpdateEnderecoInput = z.infer<typeof UpdateEnderecoInputSchema>;

export type UpdateEnderecoData = UpdateEnderecoInput & {
  enderecoMascarado?: string;
};

export function normalizeUpdateEnderecoData(
  data: UpdateEnderecoInput,
): UpdateEnderecoData {
  if (data.zona) {
    return {
      ...data,
      enderecoMascarado: buildEnderecoCodigo(
        data.zona,
        data.rua,
        data.posicao,
        data.nivel,
      ),
    };
  }

  return data;
}
