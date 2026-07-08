import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  ArmazemLayoutElementoTipoSchema,
  SaveArmazemLayoutElementInputSchema,
  SaveArmazemLayoutInputSchema,
} from '../../../domain/model/armazem-layout/armazem-layout.model.js';
import { EnderecoStatusSchema } from '../../../domain/model/endereco/endereco.model.js';

export const GetArmazemLayoutQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class GetArmazemLayoutQueryDto extends createZodDto(
  GetArmazemLayoutQuerySchema,
) {}

export const ArmazemLayoutElementResponseSchema = z.object({
  id: z.string(),
  type: ArmazemLayoutElementoTipoSchema,
  gx: z.number().int(),
  gy: z.number().int(),
  gw: z.number().int(),
  gh: z.number().int(),
  label: z.string(),
  levels: z.number().int().nullable().optional(),
  zona: z.string().nullable().optional(),
});

export const ArmazemLayoutSlotResponseSchema = z.object({
  id: z.uuid(),
  elementClientKey: z.string(),
  slotIndex: z.number().int(),
  nivel: z.number().int(),
  enderecoId: z.uuid().nullable(),
});

export class ArmazemLayoutSlotResponseDto extends createZodDto(
  ArmazemLayoutSlotResponseSchema,
) {}

export const ArmazemLayoutResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  name: z.string(),
  gridCols: z.number().int(),
  gridRows: z.number().int(),
  versao: z.number().int(),
  elements: z.array(ArmazemLayoutElementResponseSchema),
  slots: z.array(ArmazemLayoutSlotResponseSchema),
  publicadoEm: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export class ArmazemLayoutResponseDto extends createZodDto(
  ArmazemLayoutResponseSchema,
) {}

export const SaveArmazemLayoutBodySchema = SaveArmazemLayoutInputSchema;

export class SaveArmazemLayoutBodyDto extends createZodDto(
  SaveArmazemLayoutBodySchema,
) {}

export const ArmazemLayoutSlotOcupacaoResponseSchema =
  ArmazemLayoutSlotResponseSchema.extend({
    endereco: z
      .object({
        id: z.uuid(),
        enderecoMascarado: z.string(),
        zona: z.string(),
        rua: z.string(),
        posicao: z.string(),
        nivel: z.string(),
        status: EnderecoStatusSchema,
        ocupacaoPercent: z.string(),
      })
      .nullable(),
  });

export const ArmazemLayoutOcupacaoResponseSchema =
  ArmazemLayoutResponseSchema.extend({
    slots: z.array(ArmazemLayoutSlotOcupacaoResponseSchema),
  });

export class ArmazemLayoutOcupacaoResponseDto extends createZodDto(
  ArmazemLayoutOcupacaoResponseSchema,
) {}

export const SaveArmazemLayoutElementBodySchema =
  SaveArmazemLayoutElementInputSchema;
