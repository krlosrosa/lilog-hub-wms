import { z } from 'zod';

import {
  buildEnderecoCodigo,
  curvaAbcSchema,
  enderecoTipoSchema,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export const enderecoEstruturaFieldsSchema = {
  zona: z.string().min(1, 'Informe a zona').max(10),
  rua: z.string().min(1, 'Informe a rua').max(10).regex(/^\d+$/),
  posicao: z.string().min(1, 'Informe a posição').max(10).regex(/^\d+$/),
  nivel: z.string().min(1, 'Informe o nível').max(10).regex(/^\d+$/),
};

export const enderecoConfiguracaoFormSchema = z.object({
  enderecoMascarado: z.string().min(1),
  centroId: z.string().uuid('Selecione o centro'),
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

export type EnderecoConfiguracaoFormValues = z.infer<
  typeof enderecoConfiguracaoFormSchema
>;

export function resolveEnderecoCodigo(values: {
  enderecoMascarado: string;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
}) {
  if (values.zona && values.rua && values.posicao && values.nivel) {
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
