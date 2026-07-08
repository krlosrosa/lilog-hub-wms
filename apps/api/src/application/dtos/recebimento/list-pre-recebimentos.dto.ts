import { createZodDto } from 'nestjs-zod';

import { z } from 'zod';



import { PreRecebimentoSituacaoSchema } from '../../../domain/model/recebimento/recebimento.model.js';

import { PreRecebimentoResponseSchema } from './list-recebimentos.dto.js';



export const ListPreRecebimentosQuerySchema = z.object({

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  unidadeId: z.string().min(1).max(50),

  situacao: PreRecebimentoSituacaoSchema.optional(),

  transportadoraNome: z.string().min(1).max(255).optional(),

  dataInicio: z.iso.datetime().optional(),

  dataFim: z.iso.datetime().optional(),

});



export class ListPreRecebimentosQueryDto extends createZodDto(

  ListPreRecebimentosQuerySchema,

) {}



export const ListPreRecebimentosResponseSchema = z.object({

  items: z.array(PreRecebimentoResponseSchema.omit({ itens: true })),

  total: z.number().int(),

  page: z.number().int(),

  limit: z.number().int(),

});



export class ListPreRecebimentosResponseDto extends createZodDto(

  ListPreRecebimentosResponseSchema,

) {}


