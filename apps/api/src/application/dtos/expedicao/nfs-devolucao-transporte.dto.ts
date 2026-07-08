import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransporteCodigoSchema } from './gerar-mapas.dto.js';

const DataIsoSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ListarNfsDevolucaoElegiveisQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  dataInicio: DataIsoSchema,
  dataFim: DataIsoSchema,
});

export class ListarNfsDevolucaoElegiveisQueryDto extends createZodDto(
  ListarNfsDevolucaoElegiveisQuerySchema,
) {}

export const DevolucaoNfElegivelSchema = z.object({
  id: z.string().uuid(),
  numeroNf: z.string(),
  tipo: z.enum(['reentrega', 'devolucao_parcial', 'devolucao_total']),
  codCliente: z.string().nullable(),
  cliente: z.string().nullable(),
  motivo: z.string(),
  transporteOrigemId: z.string().nullable(),
  pesoTotal: z.number(),
  quantidadeItens: z.number().int(),
});

export const ListarNfsDevolucaoElegiveisResponseSchema = z.object({
  notasFiscais: z.array(DevolucaoNfElegivelSchema),
  remessasReentregaVinculadas: z.number().int(),
});

export class ListarNfsDevolucaoElegiveisResponseDto extends createZodDto(
  ListarNfsDevolucaoElegiveisResponseSchema,
) {}

export type ListarNfsDevolucaoElegiveisQueryInput = z.infer<
  typeof ListarNfsDevolucaoElegiveisQuerySchema
>;

export type ListarNfsDevolucaoElegiveisResponse = z.infer<
  typeof ListarNfsDevolucaoElegiveisResponseSchema
>;

export const VincularNfsDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nfIds: z.array(z.string().uuid()).min(1),
});

export class VincularNfsDevolucaoBodyDto extends createZodDto(
  VincularNfsDevolucaoBodySchema,
) {}

export const VincularNfsDevolucaoResponseSchema = z.object({
  remessasCriadas: z.number().int(),
  remessaIds: z.array(z.string().uuid()),
});

export class VincularNfsDevolucaoResponseDto extends createZodDto(
  VincularNfsDevolucaoResponseSchema,
) {}

export type VincularNfsDevolucaoBodyInput = z.infer<
  typeof VincularNfsDevolucaoBodySchema
> & {
  transporteId: string;
};

export type VincularNfsDevolucaoResponse = z.infer<
  typeof VincularNfsDevolucaoResponseSchema
>;

export const ImprimirMapaConferenciaReentregaBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z.array(TransporteCodigoSchema).min(1),
  configuracaoImpressaoId: z.string().uuid(),
});

export class ImprimirMapaConferenciaReentregaBodyDto extends createZodDto(
  ImprimirMapaConferenciaReentregaBodySchema,
) {}

export type ImprimirMapaConferenciaReentregaBodyInput = z.infer<
  typeof ImprimirMapaConferenciaReentregaBodySchema
>;

export type ImprimirMapaConferenciaReentregaResult = {
  buffer: Buffer;
  filename: string;
  totalGrupos: number;
};

export const DesvincularNfsDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  remessaIds: z.array(z.string().uuid()).min(1),
});

export class DesvincularNfsDevolucaoBodyDto extends createZodDto(
  DesvincularNfsDevolucaoBodySchema,
) {}

export const DesvincularNfsDevolucaoResponseSchema = z.object({
  remessasDesvinculadas: z.number().int(),
  remessaIds: z.array(z.string().uuid()),
});

export class DesvincularNfsDevolucaoResponseDto extends createZodDto(
  DesvincularNfsDevolucaoResponseSchema,
) {}

export type DesvincularNfsDevolucaoBodyInput = z.infer<
  typeof DesvincularNfsDevolucaoBodySchema
> & {
  transporteId: string;
};

export type DesvincularNfsDevolucaoResponse = z.infer<
  typeof DesvincularNfsDevolucaoResponseSchema
>;
