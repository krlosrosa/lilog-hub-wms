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

export const conferenciaItemSchema = z.object({
  id: z.string(),
  produtoId: z.string(),
  sku: z.string(),
  produto: z.string(),
  lote: z.string(),
  ean: z.string(),
  qtdXml: z.number(),
  qtdFisica: z.number(),
  status: conferenciaStatusSchema,
  avarias: z.array(conferenciaAvariaSchema),
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
  lacre: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  conditions: checklistConditionsSchema.optional(),
  checklistPreenchido: z.boolean().optional(),
  anomalias: z.number().int().nonnegative(),
  anomaliasDescricao: z.string(),
});

export type InspecaoTermica = z.infer<typeof inspecaoTermicaSchema>;

/** Processo paralelo ao status logístico do veículo (ex.: em conferência). */
export const processoInternoRecebimentoSchema = z.enum([
  'nao-iniciado',
  'conferindo',
  'finalizado',
]);

export type ProcessoInternoRecebimento = z.infer<
  typeof processoInternoRecebimentoSchema
>;

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
  processoAtual: processoInternoRecebimentoSchema,
  inspecao: inspecaoTermicaSchema,
  fotos: z.array(fotoEvidenciaSchema),
  fotoTotalInformado: z.number().int().nonnegative(),
  conferencia: z.array(conferenciaItemSchema),
  fotosAvaria: z.array(fotoEvidenciaSchema),
  numDivergencias: z.number().int().nonnegative(),
  recebimentoId: z.string().uuid().nullable().optional(),
  preRecebimentoSituacao: z.string().optional(),
  recebimentoSituacao: z.string().nullable().optional(),
});

export type RecebimentoDetalhe = z.infer<typeof recebimentoDetalheSchema>;
