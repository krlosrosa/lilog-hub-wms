import { z } from 'zod';

export const TipoMovimentoEstoqueSchema = z.enum([
  'ENTRADA',
  'SAIDA',
  'TRANSFERENCIA_DEPOSITO',
  'AJUSTE',
  'ESTORNO',
]);

export type TipoMovimentoEstoque = z.infer<typeof TipoMovimentoEstoqueSchema>;

export const NaturezaSaldoSchema = z.enum(['fisico', 'debito']);

export type NaturezaSaldo = z.infer<typeof NaturezaSaldoSchema>;

export const MovimentacaoEstoqueSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  produtoId: z.uuid(),
  depositoOrigemId: z.uuid().nullable(),
  depositoDestinoId: z.uuid().nullable(),
  tipoMovimento: TipoMovimentoEstoqueSchema,
  quantidade: z.string(),
  unidadeMedida: z.string().min(1),
  lote: z.string().nullable(),
  validade: z.coerce.date().nullable(),
  numeroSerie: z.string().nullable(),
  natureza: NaturezaSaldoSchema,
  documentoRef: z.string().nullable(),
  motivo: z.string().min(1),
  operatorId: z.number().int().nullable(),
  occurredAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type MovimentacaoEstoque = z.infer<typeof MovimentacaoEstoqueSchema>;

export const RastreioSaldoSchema = z.object({
  lote: z.string().optional(),
  validade: z.coerce.date().optional().nullable(),
  numeroSerie: z.string().optional(),
  natureza: NaturezaSaldoSchema.optional(),
});

export type RastreioSaldo = z.infer<typeof RastreioSaldoSchema>;

export const RegistrarEntradaInputSchema = z.object({
  unidadeId: z.string().min(1),
  depositoId: z.uuid(),
  produtoId: z.uuid(),
  quantidade: z.number().positive(),
  unidadeMedida: z.string().min(1),
  documentoRef: z.string().optional(),
  motivo: z.string().min(1),
  operatorId: z.number().int().nullable().optional(),
  lote: z.string().optional(),
  validade: z.coerce.date().optional().nullable(),
  numeroSerie: z.string().optional(),
  natureza: NaturezaSaldoSchema.optional(),
});

export type RegistrarEntradaInput = z.infer<typeof RegistrarEntradaInputSchema>;

export const TransferirDepositoInputSchema = z.object({
  unidadeId: z.string().min(1),
  depositoOrigemId: z.uuid(),
  depositoDestinoId: z.uuid(),
  produtoId: z.uuid(),
  quantidade: z.number().positive(),
  unidadeMedida: z.string().min(1),
  documentoRef: z.string().optional(),
  motivo: z.string().min(1),
  operatorId: z.number().int().nullable().optional(),
  lote: z.string().optional(),
  validade: z.coerce.date().optional().nullable(),
  numeroSerie: z.string().optional(),
  natureza: NaturezaSaldoSchema.optional(),
});

export type TransferirDepositoInput = z.infer<
  typeof TransferirDepositoInputSchema
>;

export const AjustarSaldoInputSchema = z.object({
  unidadeId: z.string().min(1),
  depositoId: z.uuid(),
  produtoId: z.uuid(),
  delta: z.number(),
  unidadeMedida: z.string().min(1),
  documentoRef: z.string().optional(),
  motivo: z.string().min(1),
  operatorId: z.number().int().nullable().optional(),
  lote: z.string().optional(),
  validade: z.coerce.date().optional().nullable(),
  numeroSerie: z.string().optional(),
  natureza: NaturezaSaldoSchema.optional(),
});

export type AjustarSaldoInput = z.infer<typeof AjustarSaldoInputSchema>;

export const EstornarPorDocumentoInputSchema = z.object({
  unidadeId: z.string().min(1),
  depositoId: z.uuid(),
  documentoRef: z.string().min(1),
  motivo: z.string().min(1),
  operatorId: z.number().int().nullable().optional(),
});

export type EstornarPorDocumentoInput = z.infer<
  typeof EstornarPorDocumentoInputSchema
>;
