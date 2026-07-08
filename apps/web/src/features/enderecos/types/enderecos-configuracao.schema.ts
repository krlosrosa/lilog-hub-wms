import { z } from 'zod';

import {
  buildEnderecoCodigo,
  curvaAbcSchema,
  enderecoTipoSchema,
  isEnderecoTipoEstruturado,
  isTipoEstruturaValidoParaEndereco,
  type EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

const enderecoEstruturaSegmentoSchema = z
  .string()
  .max(10, 'Máximo de 10 caracteres')
  .regex(/^[A-Za-z0-9-]*$/, 'Use apenas letras, números ou hífen');

export const enderecoEstruturaFieldsSchema = {
  zona: z.string().min(1, 'Informe a zona').max(10),
  rua: enderecoEstruturaSegmentoSchema.optional(),
  posicao: enderecoEstruturaSegmentoSchema.optional(),
  nivel: enderecoEstruturaSegmentoSchema.optional(),
};

function refineEnderecoEstruturaRequired(
  data: {
    tipo: EnderecoTipo;
    rua?: string;
    posicao?: string;
    nivel?: string;
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

export function applyEnderecoEstruturaRefinement<T extends z.ZodTypeAny>(
  schema: T,
) {
  return schema.superRefine((data, ctx) => {
    const parsed = data as {
      tipo: EnderecoTipo;
      rua?: string;
      posicao?: string;
      nivel?: string;
      tipoEstrutura?: string;
    };

    refineEnderecoEstruturaRequired(parsed, ctx);

    if (
      parsed.tipoEstrutura &&
      !isTipoEstruturaValidoParaEndereco(parsed.tipo, parsed.tipoEstrutura)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: isEnderecoTipoEstruturado(parsed.tipo)
          ? 'Selecione uma estrutura de rack para picking/pulmão'
          : 'Selecione uma estrutura operacional para este tipo de endereço',
        path: ['tipoEstrutura'],
      });
    }
  });
}

export const enderecoConfiguracaoBaseObjectSchema = z.object({
  enderecoMascarado: z.string().min(1),
  ...enderecoEstruturaFieldsSchema,
  tipo: enderecoTipoSchema,
  tipoEstrutura: z.string().min(1, 'Selecione o tipo de estrutura'),
  larguraMm: z.number().positive('Largura deve ser positiva'),
  alturaMm: z.number().positive('Altura deve ser positiva'),
  profundidadeMm: z.number().positive('Profundidade deve ser positiva'),
  cargaMaxKg: z.number().positive('Carga máxima deve ser positiva'),
  capacidadeVolume: z.number().positive().nullable().optional(),
  prioridadePicking: z.number().int().nullable().optional(),
  coordenadaX: z.number().nullable().optional(),
  coordenadaY: z.number().nullable().optional(),
  coordenadaZ: z.number().nullable().optional(),
  observacao: z.string().nullable().optional(),
  vinculoSkuFixo: z.boolean(),
  regraLoteUnico: z.boolean(),
  permiteMisturaValidade: z.boolean(),
  permiteFracionado: z.boolean(),
  curvaAbc: curvaAbcSchema,
  motivoAlteracao: z.string().optional(),
});

export const enderecoConfiguracaoFormSchema = applyEnderecoEstruturaRefinement(
  enderecoConfiguracaoBaseObjectSchema,
);

export type EnderecoConfiguracaoFormValues = z.infer<
  typeof enderecoConfiguracaoFormSchema
>;

export function resolveEnderecoCodigo(values: {
  enderecoMascarado: string;
  zona: string;
  rua?: string;
  posicao?: string;
  nivel?: string;
}) {
  if (values.zona) {
    return buildEnderecoCodigo(
      values.zona,
      values.rua,
      values.posicao,
      values.nivel,
    );
  }

  return values.enderecoMascarado;
}

export const changeLogTipoSchema = z.enum([
  'alteracao',
  'regra',
  'vinculo',
]);

export type ChangeLogTipo = z.infer<typeof changeLogTipoSchema>;

export const changeLogItemSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descricao: z.string(),
  tipo: changeLogTipoSchema,
  valorAnterior: z.string().optional(),
  valorNovo: z.string().optional(),
});

export type ChangeLogItem = z.infer<typeof changeLogItemSchema>;

export const labelPreviewSchema = z.object({
  enderecoCurto: z.string(),
  enderecoCompleto: z.string(),
  unidade: z.string(),
  dimensoesLabel: z.string(),
  formato: z.string(),
});

export type LabelPreview = z.infer<typeof labelPreviewSchema>;
