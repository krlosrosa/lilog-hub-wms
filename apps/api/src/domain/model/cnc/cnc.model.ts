import { z } from 'zod';

export const CncOrigemSchema = z.enum(['recebimento']);
export type CncOrigem = z.infer<typeof CncOrigemSchema>;

export const CncResponsavelSchema = z.enum([
  'transportadora',
  'fornecedor',
  'fabrica',
  'operacao',
  'indeterminado',
]);
export type CncResponsavel = z.infer<typeof CncResponsavelSchema>;

export const CncSituacaoSchema = z.enum([
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
]);
export type CncSituacao = z.infer<typeof CncSituacaoSchema>;

export const CncItemTipoSchema = z.enum(['divergencia', 'avaria']);
export type CncItemTipo = z.infer<typeof CncItemTipoSchema>;

export const CncSubtipoOcorrenciaSchema = z.enum([
  'falta',
  'sobra',
  'avaria',
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
  'produto_nao_previsto',
]);
export type CncSubtipoOcorrencia = z.infer<typeof CncSubtipoOcorrenciaSchema>;

export const CncTratativaTipoSchema = z.enum([
  'imediata',
  'corretiva',
  'preventiva',
]);
export type CncTratativaTipo = z.infer<typeof CncTratativaTipoSchema>;

export const CncTratativaStatusSchema = z.enum([
  'pendente',
  'concluida',
  'cancelada',
]);
export type CncTratativaStatus = z.infer<typeof CncTratativaStatusSchema>;

export const CncOrigemAvariaImpressaoSchema = z.enum([
  'transferencia',
  'avaria_interna',
  'devolucao',
]);
export type CncOrigemAvariaImpressao = z.infer<
  typeof CncOrigemAvariaImpressaoSchema
>;

export const CncTipoCargaImpressaoSchema = z.enum([
  'estivada',
  'paletizada',
  'paletizada_estivada',
]);
export type CncTipoCargaImpressao = z.infer<typeof CncTipoCargaImpressaoSchema>;

export const CncPalletAvariadoImpressaoSchema = z.enum([
  'padrao',
  'misto',
  'padrao_misto',
]);
export type CncPalletAvariadoImpressao = z.infer<
  typeof CncPalletAvariadoImpressaoSchema
>;

export const CncLocalAvariaImpressaoSchema = z.enum([
  'parte_superior',
  'meio',
  'base_inferior',
]);
export type CncLocalAvariaImpressao = z.infer<
  typeof CncLocalAvariaImpressaoSchema
>;

export const CncOpcoesImpressaoSchema = z.object({
  origemAvaria: CncOrigemAvariaImpressaoSchema.nullable(),
  tipoCarga: CncTipoCargaImpressaoSchema.nullable(),
  palletAvariado: CncPalletAvariadoImpressaoSchema.nullable(),
  localAvaria: z.array(CncLocalAvariaImpressaoSchema),
});
export type CncOpcoesImpressao = z.infer<typeof CncOpcoesImpressaoSchema>;

export const CNC_EVENTO = {
  CNC_CRIADA: 'CNC_CRIADA',
  ANALISE_INICIADA: 'ANALISE_INICIADA',
  ENCERRADA: 'ENCERRADA',
  CANCELADA: 'CANCELADA',
  TRATATIVA_ADICIONADA: 'TRATATIVA_ADICIONADA',
  TRATATIVA_CONCLUIDA: 'TRATATIVA_CONCLUIDA',
  ITEM_ATUALIZADO: 'ITEM_ATUALIZADO',
  ITEM_REMOVIDO: 'ITEM_REMOVIDO',
} as const;

export type CncEventoTipo =
  (typeof CNC_EVENTO)[keyof typeof CNC_EVENTO];
