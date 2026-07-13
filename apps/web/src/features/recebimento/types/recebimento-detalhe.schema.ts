import { z } from 'zod';

import { recebimentoStatusSchema } from '@/features/recebimento/types/recebimento-lista.schema';

export const conferenciaStatusSchema = z.enum([
  'concluido',
  'faltante',
  'sobra',
]);

export type ConferenciaStatus = z.infer<typeof conferenciaStatusSchema>;

export const fotoEvidenciaSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  legenda: z.string(),
});

export type FotoEvidencia = z.infer<typeof fotoEvidenciaSchema>;

export const conferenciaAvariaSchema = z.object({
  id: z.string().uuid(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  quantidadeCaixas: z.number().int(),
  quantidadeUnidades: z.number().int(),
  photoCount: z.number().int(),
  replicado: z.boolean(),
  fotos: z.array(fotoEvidenciaSchema).default([]),
});

export type ConferenciaAvaria = z.infer<typeof conferenciaAvariaSchema>;

export const loteDetalheItemSchema = z.object({
  lote: z.string().nullable(),
  qtdEsperada: z.number(),
  qtdRecebida: z.number(),
});

export type LoteDetalheItem = z.infer<typeof loteDetalheItemSchema>;

export const conferenciaItemSchema = z.object({
  id: z.string(),
  produtoId: z.string(),
  sku: z.string(),
  produto: z.string(),
  lote: z.string(),
  ean: z.string(),
  qtdXml: z.number(),
  qtdFisica: z.number(),
  pesoVariavel: z.boolean().default(false),
  pesoXml: z.number().nullable().default(null),
  pesoFisico: z.number().nullable().default(null),
  status: conferenciaStatusSchema,
  avarias: z.array(conferenciaAvariaSchema),
  lotesDetalhe: z.array(loteDetalheItemSchema).default([]),
  unidadesPorCaixa: z.number().int().nullable().optional(),
});

export type ConferenciaItem = z.infer<typeof conferenciaItemSchema>;

export const checklistConditionsSchema = z.object({
  limpeza: z.boolean(),
  odor: z.boolean(),
  estrutura: z.boolean(),
  vedacao: z.boolean(),
});

export const inspecaoTermicaSchema = z.object({
  tempBau: z.number().nullable(),
  tempProduto: z.number().nullable(),
  tempProdutoInicio: z.number().nullable().optional(),
  tempProdutoMeio: z.number().nullable().optional(),
  tempProdutoFim: z.number().nullable().optional(),
  lacre: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  conditions: checklistConditionsSchema.optional(),
  checklistPreenchido: z.boolean().optional(),
  anomalias: z.number().int().nonnegative(),
  anomaliasDescricao: z.string(),
});

export type InspecaoTermica = z.infer<typeof inspecaoTermicaSchema>;

export const impedimentoDetalheSchema = z.object({
  id: z.string().uuid(),
  tipo: z.string(),
  tipoLabel: z.string(),
  descricao: z.string(),
  photoCount: z.number().int().nonnegative(),
  registradoPorNome: z.string().nullable(),
  registradoPorMatricula: z.string().nullable(),
  registradoEm: z.string(),
  fotos: z.array(fotoEvidenciaSchema).default([]),
});

export type ImpedimentoDetalhe = z.infer<typeof impedimentoDetalheSchema>;

export const recebimentoDetalheSchema = z.object({
  id: z.string(),
  /** Exibir no topo: `RCV-88291`. */
  numero: z.string(),
  /** Texto já formatado para subtítulo da página. */
  dataInicio: z.string(),
  unidade: z.string(),
  placa: z.string(),
  transportador: z.string(),
  documentacaoOk: z.boolean(),
  status: recebimentoStatusSchema,
  inspecao: inspecaoTermicaSchema,
  fotos: z.array(fotoEvidenciaSchema),
  fotoTotalInformado: z.number().int().nonnegative(),
  conferencia: z.array(conferenciaItemSchema),
  fotosAvaria: z.array(fotoEvidenciaSchema),
  numDivergencias: z.number().int().nonnegative(),
  recebimentoId: z.string().uuid().nullable().optional(),
  preRecebimentoSituacao: z.string().optional(),
  recebimentoSituacao: z.string().nullable().optional(),
  modoUnitizacao: z
    .enum(['bipar_palete_no_recebimento', 'gerar_etiqueta_na_armazenagem'])
    .nullable()
    .optional(),
  /** True quando itens conferidos já possuem palete bipado no PWA. */
  temPaletesBipados: z.boolean().optional(),
  conferenteId: z.number().int().nullable().optional(),
  conferenteNome: z.string().nullable().optional(),
  conferenteMatricula: z.string().nullable().optional(),
  /** Data/hora formatada do início da conferência (recebimento.dataInicio). */
  conferenciaIniciadaEm: z.string().nullable().optional(),
  /** Data/hora formatada do fim da conferência (recebimento.dataFim). */
  conferenciaFinalizadaEm: z.string().nullable().optional(),
  quantidadePaletesEsperada: z.number().int().nonnegative().nullable().optional(),
  numeroTermoPalete: z.string().nullable().optional(),
  quantidadePaletes: z.number().int().nonnegative().nullable().optional(),
  impedimento: impedimentoDetalheSchema.nullable().optional(),
});

export type RecebimentoDetalhe = z.infer<typeof recebimentoDetalheSchema>;

export function canReabrirRecebimento(status: RecebimentoDetalhe['status']): boolean {
  return status === 'conferido';
}
