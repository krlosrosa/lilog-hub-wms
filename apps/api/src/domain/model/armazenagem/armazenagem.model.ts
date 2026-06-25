import { z } from 'zod';

export const ModoUnitizacaoSchema = z.enum([
  'bipar_palete_no_recebimento',
  'gerar_etiqueta_na_armazenagem',
]);

export type ModoUnitizacao = z.infer<typeof ModoUnitizacaoSchema>;

export const UnitizadorTipoSchema = z.enum(['palete', 'volume', 'caixa']);

export type UnitizadorTipo = z.infer<typeof UnitizadorTipoSchema>;

export const UnitizadorOrigemSchema = z.enum([
  'palete_virgem',
  'gerado_sistema',
]);

export type UnitizadorOrigem = z.infer<typeof UnitizadorOrigemSchema>;

export const UnitizadorStatusSchema = z.enum([
  'virgem',
  'em_recebimento',
  'aguardando_armazenagem',
  'armazenado',
  'cancelado',
]);

export type UnitizadorStatus = z.infer<typeof UnitizadorStatusSchema>;

export const DemandaArmazenagemStatusSchema = z.enum([
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export type DemandaArmazenagemStatus = z.infer<
  typeof DemandaArmazenagemStatusSchema
>;

export const ItemArmazenagemStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'armazenado',
  'divergente',
]);

export type ItemArmazenagemStatus = z.infer<typeof ItemArmazenagemStatusSchema>;

export const UnitizadorSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  codigo: z.string().min(1),
  tipo: UnitizadorTipoSchema,
  origem: UnitizadorOrigemSchema,
  status: UnitizadorStatusSchema,
  recebimentoId: z.uuid().nullable(),
  enderecoAtualId: z.uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Unitizador = z.infer<typeof UnitizadorSchema>;

export const CreateUnitizadorInputSchema = UnitizadorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUnitizadorInput = z.infer<typeof CreateUnitizadorInputSchema>;

export const ItemArmazenagemInputSchema = z.object({
  unitizadorId: z.uuid().nullable(),
  produtoId: z.uuid(),
  quantidade: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  lote: z.string().nullable(),
  validade: z.coerce.date().nullable(),
  numeroSerie: z.string().nullable(),
  enderecoSugeridoId: z.uuid().nullable().optional(),
});

export type ItemArmazenagemInput = z.infer<typeof ItemArmazenagemInputSchema>;

export const CreateDemandaArmazenagemInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  recebimentoId: z.uuid(),
  modoUnitizacao: ModoUnitizacaoSchema,
  itens: z.array(ItemArmazenagemInputSchema).min(1),
});

export type CreateDemandaArmazenagemInput = z.infer<
  typeof CreateDemandaArmazenagemInputSchema
>;

export const ConfirmarItemArmazenagemInputSchema = z.object({
  enderecoConfirmadoId: z.uuid(),
  unitizadorCodigo: z.string().min(1).optional(),
  motivoDivergencia: z.string().min(1).max(500).optional(),
});

export type ConfirmarItemArmazenagemInput = z.infer<
  typeof ConfirmarItemArmazenagemInputSchema
>;
