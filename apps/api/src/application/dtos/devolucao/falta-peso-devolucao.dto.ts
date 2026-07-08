import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DevolucaoFaltaPesoTratativaContabilSchema = z.enum([
  'diferenca_peso',
]);

export const DevolucaoFaltaPesoStatusSchema = z.enum([
  'pendente',
  'validada',
  'rejeitada',
]);

export const ListarFaltasPesoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  status: DevolucaoFaltaPesoStatusSchema.optional(),
});

export class ListarFaltasPesoQueryDto extends createZodDto(
  ListarFaltasPesoQuerySchema,
) {}

export const FaltaPesoDetalheSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  notaFiscalId: z.uuid(),
  itemId: z.uuid(),
  sku: z.string(),
  descricaoProduto: z.string().nullable(),
  pesoVariavel: z.boolean(),
  pesoEsperadoKg: z.number().nonnegative(),
  pesoDevolvidoKg: z.number().nonnegative(),
  pesoFaltanteKg: z.number().nonnegative(),
  quantidadeFiscalOriginal: z.number().nullable(),
  quantidadeContabilConsiderada: z.number().nonnegative(),
  tratativaContabil: DevolucaoFaltaPesoTratativaContabilSchema,
  zerarQuantidadeContabil: z.boolean(),
  motivo: z.string().nullable(),
  observacao: z.string().nullable(),
  status: DevolucaoFaltaPesoStatusSchema,
  registradoPorUserId: z.number().int().nullable(),
  registradoEm: z.iso.datetime(),
  validadoPorUserId: z.number().int().nullable(),
  validadoEm: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ListarFaltasPesoResponseSchema = z.object({
  faltasPeso: z.array(FaltaPesoDetalheSchema),
});

export class ListarFaltasPesoResponseDto extends createZodDto(
  ListarFaltasPesoResponseSchema,
) {}

export const RegistrarFaltaPesoResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  itemId: z.uuid(),
  pesoFaltanteKg: z.number().nonnegative(),
  quantidadeFiscalOriginal: z.number().nullable(),
  quantidadeContabilConsiderada: z.number().nonnegative(),
  tratativaContabil: DevolucaoFaltaPesoTratativaContabilSchema,
  zerarQuantidadeContabil: z.boolean(),
  status: DevolucaoFaltaPesoStatusSchema,
});

export class RegistrarFaltaPesoResponseDto extends createZodDto(
  RegistrarFaltaPesoResponseSchema,
) {}

export const ValidarFaltaPesoResponseSchema = FaltaPesoDetalheSchema;

export class ValidarFaltaPesoResponseDto extends createZodDto(
  ValidarFaltaPesoResponseSchema,
) {}
