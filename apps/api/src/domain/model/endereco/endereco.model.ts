import { z } from 'zod';

export const ENDERECO_CODIGO_REGEX = /^[A-Z] \d{4} \d{3} \d{2}$/;

export const EnderecoTipoSchema = z.enum([
  'picking',
  'pulmao',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'doca',
]);

export type EnderecoTipo = z.infer<typeof EnderecoTipoSchema>;

export const EnderecoStatusSchema = z.enum([
  'disponivel',
  'ocupado',
  'bloqueado',
  'inventario',
  'inativo',
]);

export type EnderecoStatus = z.infer<typeof EnderecoStatusSchema>;

export const EnderecoTipoEstruturaSchema = z.enum([
  'porta-palete',
  'drive-in',
  'estante-dinamica',
  'flow-rack',
]);

export type EnderecoTipoEstrutura = z.infer<typeof EnderecoTipoEstruturaSchema>;

export const CurvaAbcEnderecoSchema = z.enum(['A', 'B', 'C']);

export type CurvaAbcEndereco = z.infer<typeof CurvaAbcEnderecoSchema>;

export const EnderecoCentroSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  centro: z.string(),
  empresa: z.string(),
  nome: z.string(),
});

export type EnderecoCentro = z.infer<typeof EnderecoCentroSchema>;

const enderecoEstruturaFields = {
  zona: z.string().min(1).max(10),
  rua: z
    .string()
    .min(1)
    .max(10)
    .regex(/^\d+$/, 'Rua deve conter apenas números'),
  posicao: z
    .string()
    .min(1)
    .max(10)
    .regex(/^\d+$/, 'Posição deve conter apenas números'),
  nivel: z
    .string()
    .min(1)
    .max(10)
    .regex(/^\d+$/, 'Nível deve conter apenas números'),
};

export function buildEnderecoCodigo(
  zona: string,
  rua: string,
  posicao: string,
  nivel: string,
): string {
  return `${zona.trim().toUpperCase()} ${rua.trim().padStart(4, '0')} ${posicao.trim().padStart(3, '0')} ${nivel.trim().padStart(2, '0')}`;
}

export const EnderecoSchema = z.object({
  id: z.uuid(),
  enderecoMascarado: z
    .string()
    .min(1)
    .regex(ENDERECO_CODIGO_REGEX, 'Use o formato ZONA RUA POSICAO NIVEL (ex: A 0001 001 10)'),
  centroId: z.uuid(),
  centro: EnderecoCentroSchema,
  ...enderecoEstruturaFields,
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
  'centroId',
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

export const CreateEnderecoInputSchema = z
  .object({
    centroId: z.uuid(),
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
  .transform((data) => ({
    ...data,
    enderecoMascarado: buildEnderecoCodigo(
      data.zona,
      data.rua,
      data.posicao,
      data.nivel,
    ),
  }));

export type CreateEnderecoInput = z.input<typeof CreateEnderecoInputSchema>;
export type CreateEnderecoData = z.output<typeof CreateEnderecoInputSchema>;

export const UpdateEnderecoInputSchema = z.object({
  centroId: z.uuid().optional(),
  zona: enderecoEstruturaFields.zona.optional(),
  rua: enderecoEstruturaFields.rua.optional(),
  posicao: enderecoEstruturaFields.posicao.optional(),
  nivel: enderecoEstruturaFields.nivel.optional(),
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
  if (data.zona && data.rua && data.posicao && data.nivel) {
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
