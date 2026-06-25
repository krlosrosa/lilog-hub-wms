import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListPlacasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  tipoVeiculo: z.string().optional(),
});

export class ListPlacasQueryDto extends createZodDto(ListPlacasQuerySchema) {}

export const ListPlacasUnidadeQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  tipoVeiculo: z.string().optional(),
});

export class ListPlacasUnidadeQueryDto extends createZodDto(
  ListPlacasUnidadeQuerySchema,
) {}

export const PlacaTransportadoraResponseSchema = z.object({
  id: z.uuid(),
  transportadoraId: z.uuid(),
  idRavexVeiculo: z.number().int(),
  placa: z.string(),
  tipoVeiculoIdRavex: z.number().int().nullable(),
  tipoVeiculoNome: z.string().nullable(),
  peso: z.string().nullable(),
  cubagem: z.string().nullable(),
  tara: z.string().nullable(),
  estrangeiro: z.boolean(),
  perfilTarifaId: z.uuid().nullable(),
  perfilTarifaNome: z.string().nullable(),
  transportadoraNome: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class PlacaTransportadoraResponseDto extends createZodDto(
  PlacaTransportadoraResponseSchema,
) {}

export const ListPlacasResponseSchema = z.object({
  items: z.array(PlacaTransportadoraResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListPlacasResponseDto extends createZodDto(ListPlacasResponseSchema) {}

export const SincronizarPlacasResponseSchema = ListPlacasResponseSchema.extend({
  inseridas: z.number().int(),
  atualizadas: z.number().int(),
  removidas: z.number().int(),
});

export class SincronizarPlacasResponseDto extends createZodDto(
  SincronizarPlacasResponseSchema,
) {}

export const AtualizarPerfilPlacasMassaResponseSchema = z.object({
  atualizadas: z.number().int(),
});

export class AtualizarPerfilPlacasMassaResponseDto extends createZodDto(
  AtualizarPerfilPlacasMassaResponseSchema,
) {}

export const BuscarPlacasUnidadeResponseSchema = z.object({
  items: z.array(PlacaTransportadoraResponseSchema),
});

export class BuscarPlacasUnidadeResponseDto extends createZodDto(
  BuscarPlacasUnidadeResponseSchema,
) {}
