import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TipoCargaSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';

export const FaixaKmResponseSchema = z.object({
  id: z.uuid(),
  kmInicial: z.string(),
  kmFinal: z.string().nullable(),
  valor: z.string(),
  itinerario: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class FaixaKmResponseDto extends createZodDto(FaixaKmResponseSchema) {}

export const PerfilTarifaResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  idRavex: z.number().int(),
  nome: z.string(),
  descricao: z.string().nullable(),
  peso: z.string(),
  cubagem: z.string().nullable(),
  tipoCarga: TipoCargaSchema,
  faixasKm: z.array(FaixaKmResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class PerfilTarifaResponseDto extends createZodDto(
  PerfilTarifaResponseSchema,
) {}

export const ListPerfisTarifasQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
  tipoCarga: TipoCargaSchema.optional(),
});

export class ListPerfisTarifasQueryDto extends createZodDto(
  ListPerfisTarifasQuerySchema,
) {}

export const ListPerfisTarifasResponseSchema = z.object({
  items: z.array(PerfilTarifaResponseSchema),
});

export class ListPerfisTarifasResponseDto extends createZodDto(
  ListPerfisTarifasResponseSchema,
) {}

export const RavexTipoVeiculoResponseSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  peso: z.number(),
  cubagem: z.number(),
  tara: z.number(),
});

export class RavexTipoVeiculoDto extends createZodDto(
  RavexTipoVeiculoResponseSchema,
) {}

export const ListTiposVeiculoRavexResponseSchema = z.array(
  RavexTipoVeiculoResponseSchema,
);

export class ListTiposVeiculoRavexResponseDto extends createZodDto(
  ListTiposVeiculoRavexResponseSchema,
) {}
