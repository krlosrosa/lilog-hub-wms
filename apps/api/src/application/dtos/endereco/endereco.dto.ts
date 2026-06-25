import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CurvaAbcEnderecoSchema,
  EnderecoCentroSchema,
  EnderecoStatusSchema,
  EnderecoTipoEstruturaSchema,
  EnderecoTipoSchema,
} from '../../../domain/model/endereco/endereco.model.js';

export const ListEnderecosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: EnderecoStatusSchema.optional(),
  tipo: EnderecoTipoSchema.optional(),
  centroId: z.uuid().optional(),
  unidadeId: z.string().min(1).max(50).optional(),
  search: z.string().optional(),
});

export class ListEnderecosQueryDto extends createZodDto(
  ListEnderecosQuerySchema,
) {}

export const EnderecoResponseSchema = z.object({
  id: z.uuid(),
  enderecoMascarado: z.string(),
  centroId: z.uuid(),
  centro: EnderecoCentroSchema,
  zona: z.string(),
  rua: z.string(),
  posicao: z.string(),
  nivel: z.string(),
  tipo: EnderecoTipoSchema,
  status: EnderecoStatusSchema,
  tipoEstrutura: EnderecoTipoEstruturaSchema,
  larguraMm: z.number().int(),
  alturaMm: z.number().int(),
  profundidadeMm: z.number().int(),
  cargaMaxKg: z.string(),
  capacidadeVolume: z.string().nullable(),
  prioridadePicking: z.number().int().nullable(),
  coordenadaX: z.string().nullable(),
  coordenadaY: z.string().nullable(),
  coordenadaZ: z.string().nullable(),
  observacao: z.string().nullable(),
  vinculoSkuFixo: z.boolean(),
  regraLoteUnico: z.boolean(),
  permiteMisturaValidade: z.boolean(),
  permiteFracionado: z.boolean(),
  curvaAbc: CurvaAbcEnderecoSchema,
  ocupacaoPercent: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class EnderecoResponseDto extends createZodDto(EnderecoResponseSchema) {}

export const ListEnderecosResponseSchema = z.object({
  items: z.array(EnderecoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListEnderecosResponseDto extends createZodDto(
  ListEnderecosResponseSchema,
) {}

export const EnderecoKpiResponseSchema = z.object({
  totalEnderecos: z.number().int().nonnegative(),
  totalEnderecosTrendPercent: z.number(),
  ocupacaoGlobalPercent: z.number().min(0).max(100),
  posicoesBloqueadas: z.number().int().nonnegative(),
  crossDockingAtivos: z.number().int().nonnegative(),
  enderecosDisponiveis: z.number().int().nonnegative(),
  enderecosOcupados: z.number().int().nonnegative(),
  taxaOcupacaoGeral: z.number().min(0).max(100),
});

export class EnderecoKpiResponseDto extends createZodDto(
  EnderecoKpiResponseSchema,
) {}

export const EnderecoActionBodySchema = z.object({
  motivo: z.string().min(1).optional(),
});

export class EnderecoActionBodyDto extends createZodDto(
  EnderecoActionBodySchema,
) {}

export const BlockEnderecoBodySchema = z.object({
  motivo: z.string().min(1, 'Motivo é obrigatório'),
});

export class BlockEnderecoBodyDto extends createZodDto(BlockEnderecoBodySchema) {}
