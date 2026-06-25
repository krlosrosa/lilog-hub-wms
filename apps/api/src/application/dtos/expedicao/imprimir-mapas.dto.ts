import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TipoMapaImpressaoSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
  'todos',
]);

export type TipoMapaImpressaoProcesso =
  | 'separacao'
  | 'conferencia'
  | 'carregamento';

export const ImprimirMapasBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z.array(z.string().uuid()).min(1),
  configuracaoImpressaoId: z.string().uuid(),
  tipoMapa: TipoMapaImpressaoSchema,
});

export class ImprimirMapasBodyDto extends createZodDto(ImprimirMapasBodySchema) {}

export type ImprimirMapasBodyInput = z.infer<typeof ImprimirMapasBodySchema>;

export type ImprimirMapasResult = {
  buffer: Buffer;
  filename: string;
  totalGrupos: number;
};
