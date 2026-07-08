import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoSituacaoSchema } from '../../../domain/model/recebimento/recebimento.model.js';

export const GerarLinkRastreioResponseSchema = z.object({
  token: z.uuid(),
  url: z.url(),
});

export class GerarLinkRastreioResponseDto extends createZodDto(
  GerarLinkRastreioResponseSchema,
) {}

export const RastreioStatusResponseSchema = z.object({
  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),
  situacao: PreRecebimentoSituacaoSchema,
  situacaoLabel: z.string(),
  docaNome: z.string().nullable(),
  horarioPrevisto: z.iso.datetime(),
  dataChegada: z.iso.datetime().nullable(),
  unidadeNome: z.string(),
  finalizado: z.boolean(),
});

export class RastreioStatusResponseDto extends createZodDto(
  RastreioStatusResponseSchema,
) {}
