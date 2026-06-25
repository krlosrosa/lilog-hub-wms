import { z } from 'zod';

export const movimentacaoPrioridadeSchema = z.enum([
  'URGENTE',
  'ALTA',
  'MEDIA',
  'BAIXA',
]);
export type MovimentacaoPrioridade = z.infer<
  typeof movimentacaoPrioridadeSchema
>;

export const movimentacaoTipoSchema = z.enum([
  'Ressuprimento',
  'Quarentena',
  'Slotting',
  'Inventario',
]);
export type MovimentacaoTipo = z.infer<typeof movimentacaoTipoSchema>;

export const movimentacaoItemSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  produto: z.string(),
  sku: z.string(),
  lote: z.string(),
  origem: z.string(),
  destino: z.string(),
  motivoRegra: z.string(),
  prioridade: movimentacaoPrioridadeSchema,
  tipo: movimentacaoTipoSchema,
  dataSolicitacao: z.string(),
});

export type MovimentacaoItem = z.infer<typeof movimentacaoItemSchema>;

export const movimentacaoSummarySchema = z.object({
  totalPendente: z.number().nonnegative(),
  totalPendenteUnidade: z.string(),
  impactoOperacional: z.number().nonnegative(),
  impactoOperacionalUnidade: z.string(),
  alertasCriticos: z.number().int().nonnegative(),
  alertasCriticosLabel: z.string(),
});

export type MovimentacaoSummary = z.infer<typeof movimentacaoSummarySchema>;

export const filtroTipoMovimentacaoSchema = z.enum([
  'todos',
  'Ressuprimento',
  'Quarentena',
  'Slotting',
  'Inventario',
]);
export type FiltroTipoMovimentacao = z.infer<
  typeof filtroTipoMovimentacaoSchema
>;

export const filtroPrioridadeMovimentacaoSchema = z.enum([
  'todas',
  'URGENTE',
  'ALTA',
  'MEDIA',
  'BAIXA',
]);
export type FiltroPrioridadeMovimentacao = z.infer<
  typeof filtroPrioridadeMovimentacaoSchema
>;

export const filtrosMovimentacaoSchema = z.object({
  tipo: filtroTipoMovimentacaoSchema,
  prioridade: filtroPrioridadeMovimentacaoSchema,
  data: z.string(),
});

export type FiltrosMovimentacao = z.infer<typeof filtrosMovimentacaoSchema>;

export const MOVIMENTACAO_PRIORIDADE_LABELS: Record<
  MovimentacaoPrioridade,
  string
> = {
  URGENTE: 'URGENTE',
  ALTA: 'ALTA',
  MEDIA: 'MÉDIA',
  BAIXA: 'BAIXA',
};

export const MOVIMENTACAO_TIPO_LABELS: Record<MovimentacaoTipo, string> = {
  Ressuprimento: 'Ressuprimento',
  Quarentena: 'Quarentena',
  Slotting: 'Slotting',
  Inventario: 'Inventário',
};
