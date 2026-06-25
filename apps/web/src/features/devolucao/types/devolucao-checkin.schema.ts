import { z } from 'zod';

export const nfTipoDevolucaoSchema = z.enum(['parcial', 'total']);

export type NfTipoDevolucao = z.infer<typeof nfTipoDevolucaoSchema>;

export const nfItemStatusSchema = z.enum([
  'validado',
  'divergente',
  'pendente',
]);

export type NfItemStatus = z.infer<typeof nfItemStatusSchema>;

export const nfItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  produto: z.string(),
  gtin: z.string().optional(),
  qtdNf: z.number().int().nonnegative(),
  qtdDevolucao: z.number().int().nonnegative(),
  qtdConferida: z.number().int().nonnegative(),
  motivo: z.string(),
  status: nfItemStatusSchema,
});

export type NfItem = z.infer<typeof nfItemSchema>;

export const nfRowStatusSchema = z.enum([
  'validado',
  'pendente',
  'divergente',
  'parcial',
]);

export type NfRowStatus = z.infer<typeof nfRowStatusSchema>;

export const nfRowSchema = z.object({
  id: z.string(),
  numero: z.string(),
  cliente: z.string(),
  tipoDevolucao: nfTipoDevolucaoSchema,
  itensValidados: z.number().int().nonnegative(),
  itensTotal: z.number().int().positive(),
  /** Soma das quantidades devolvidas por item (derivado) */
  qtdDevolvida: z.number().int().nonnegative(),
  /** Motivo do retorno no nível da NF (editável na tabela principal) */
  motivo: z.string(),
  valorTotal: z.number().nonnegative(),
  status: nfRowStatusSchema,
  itens: z.array(nfItemSchema),
  divergenciaCritica: z.boolean().default(false),
  mensagemDivergencia: z.string().optional(),
  viagemOrigemId: z.string().optional(),
  viagemOrigemLabel: z.string().optional(),
});

export type NfRow = z.infer<typeof nfRowSchema>;

export const outraViagemSchema = z.object({
  id: z.string(),
  viagemRavexId: z.string(),
  placa: z.string(),
  motorista: z.string(),
  transportadora: z.string(),
  data: z.string(),
  nfs: z.array(nfRowSchema),
});

export type OutraViagem = z.infer<typeof outraViagemSchema>;

export const tripInfoSchema = z.object({
  motorista: z.string(),
  placa: z.string(),
  transportadora: z.string(),
  viagemRavexId: z.string(),
});

export type TripInfo = z.infer<typeof tripInfoSchema>;

export const dockOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type DockOption = z.infer<typeof dockOptionSchema>;

export const palletControlSchema = z.object({
  paletesRetornados: z.number().int().nonnegative(),
  chapasPbr: z.number().int().nonnegative(),
});

export type PalletControl = z.infer<typeof palletControlSchema>;

export const checkinConfigSchema = z.object({
  docaId: z.string().min(1, 'Selecione uma doca'),
  cargaSegregada: z.boolean(),
});

export type CheckinConfig = z.infer<typeof checkinConfigSchema>;

export const NF_TIPO_LABELS: Record<NfTipoDevolucao, string> = {
  parcial: 'Parcial',
  total: 'Total',
};

export const NF_ITEM_STATUS_LABELS: Record<NfItemStatus, string> = {
  validado: 'Validado',
  divergente: 'Divergente',
  pendente: 'Pendente',
};

export const MOTIVOS_DEVOLUCAO = [
  'Avaria no transporte',
  'Erro de pedido',
  'Vencimento próximo',
  'Recusa Cliente',
  'Produto não retornado',
] as const;
