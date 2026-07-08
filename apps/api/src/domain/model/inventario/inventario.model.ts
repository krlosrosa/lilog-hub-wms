import { z } from 'zod';

export const InventarioTipoSchema = z.enum(['ciclo', 'geral']);
export type InventarioTipo = z.infer<typeof InventarioTipoSchema>;

export const InventarioStatusSchema = z.enum([
  'agendado',
  'em_progresso',
  'pausado',
  'concluido',
]);
export type InventarioStatus = z.infer<typeof InventarioStatusSchema>;

export const DemandaContagemTipoSchema = z.enum(['cega', 'validacao']);
export type DemandaContagemTipo = z.infer<typeof DemandaContagemTipoSchema>;

export const DemandaContagemPrioridadeSchema = z.enum([
  'baixa',
  'media',
  'alta',
  'critica',
]);
export type DemandaContagemPrioridade = z.infer<
  typeof DemandaContagemPrioridadeSchema
>;

export const DemandaContagemStatusSchema = z.enum([
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada',
]);
export type DemandaContagemStatus = z.infer<typeof DemandaContagemStatusSchema>;

export const DemandaEnderecoStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'conferido',
]);
export type DemandaEnderecoStatus = z.infer<typeof DemandaEnderecoStatusSchema>;

export const ContagemTipoSchema = z.enum(['cega', 'validacao']);
export type ContagemTipo = z.infer<typeof ContagemTipoSchema>;

export const DivergenciaInventarioTipoSchema = z.enum([
  'falta',
  'sobra',
  'endereco_vazio',
  'anomalia',
]);
export type DivergenciaInventarioTipo = z.infer<
  typeof DivergenciaInventarioTipoSchema
>;

export const DivergenciaInventarioStatusSchema = z.enum([
  'pendente',
  'aprovada',
  'reprovada',
  'aplicada',
]);
export type DivergenciaInventarioStatus = z.infer<
  typeof DivergenciaInventarioStatusSchema
>;

export const DemandaFiltrosSchema = z
  .object({
    enderecoIds: z.array(z.uuid()).default([]),
    zonas: z.array(z.string().min(1)).default([]),
    rackInicio: z.string().optional(),
    rackFim: z.string().optional(),
    categorias: z.array(z.string()).default([]),
    skuBusca: z.string().optional(),
  })
  .refine(
    (data) => data.enderecoIds.length > 0 || data.zonas.length > 0,
    {
      message: 'Selecione endereços de contagem ou ao menos uma zona',
      path: ['enderecoIds'],
    },
  );
export type DemandaFiltros = z.infer<typeof DemandaFiltrosSchema>;

export const CreateInventarioInputSchema = z.object({
  nome: z.string().min(3),
  tipo: InventarioTipoSchema,
  dataProgramada: z.coerce.date(),
  centroId: z.uuid(),
  responsavelGestorId: z.number().int().positive().optional(),
});
export type CreateInventarioInput = z.infer<typeof CreateInventarioInputSchema>;

export const CreateDemandaContagemInputSchema = z.object({
  inventarioId: z.uuid(),
  nome: z.string().min(1),
  tipo: DemandaContagemTipoSchema,
  prioridade: DemandaContagemPrioridadeSchema.default('media'),
  ativo: z.boolean().default(true),
  responsavelId: z.number().int().positive(),
  filtros: DemandaFiltrosSchema,
  observacoes: z.string().default(''),
  alertaFragilidade: z.boolean().default(false),
});
export type CreateDemandaContagemInput = z.infer<
  typeof CreateDemandaContagemInputSchema
>;

export const SubmitContagemCegaInputSchema = z
  .object({
    demandaId: z.uuid(),
    demandaEnderecoId: z.uuid(),
    operatorId: z.number().int().positive(),
    enderecoArmazenagem: z.string().min(1),
    enderecoVazio: z.boolean().default(false),
    codigoProduto: z.string().optional(),
    quantidadeCaixas: z.number().int().min(0),
    quantidadeUnidades: z.number().int().min(0),
    lote: z.string().optional(),
    peso: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enderecoVazio) {
      return;
    }

    if (!data.codigoProduto?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o código do produto',
        path: ['codigoProduto'],
      });
    }

    if (!data.lote?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o lote',
        path: ['lote'],
      });
    }

    if (data.peso == null || data.peso <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o peso',
        path: ['peso'],
      });
    }

    if (data.quantidadeCaixas <= 0 && data.quantidadeUnidades <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe caixas ou unidades',
        path: ['quantidadeUnidades'],
      });
    }
  });
export type SubmitContagemCegaInput = z.infer<
  typeof SubmitContagemCegaInputSchema
>;

export const SubmitContagemValidacaoInputSchema = z.object({
  demandaId: z.uuid(),
  demandaEnderecoId: z.uuid(),
  operatorId: z.number().int().positive(),
  enderecoConfirmado: z.string().optional(),
  sscc: z.string().optional(),
  enderecoVazio: z.boolean().default(false),
  anomaliaEncontrada: z.boolean().default(false),
  correspondeAoEsperado: z.boolean().default(false),
  quantidadeCaixas: z.number().int().min(0),
  quantidadeUnidades: z.number().int().min(0),
  lote: z.string().optional(),
  peso: z.number().min(0).optional(),
  codigoProduto: z.string().default(''),
  produtoId: z.string().optional(),
  saldoEnderecoId: z.uuid().optional(),
});
export type SubmitContagemValidacaoInput = z.infer<
  typeof SubmitContagemValidacaoInputSchema
>;

export const SubmitContagemAvariaInputSchema = z.object({
  demandaId: z.uuid(),
  demandaEnderecoId: z.uuid(),
  operatorId: z.number().int().positive(),
  motivo: z.string().min(1),
  quantidadeCaixas: z.number().int().min(0),
  quantidadeUnidades: z.number().int().min(0),
  photoCount: z.number().int().min(0).default(0),
  contagemId: z.uuid().optional(),
});
export type SubmitContagemAvariaInput = z.infer<
  typeof SubmitContagemAvariaInputSchema
>;

export function parseRackSegment(enderecoMascarado: string): string | null {
  const parts = enderecoMascarado.split('-');
  return parts.length >= 3 ? parts[2]! : null;
}

export function rackInRange(
  rack: string,
  inicio?: string,
  fim?: string,
): boolean {
  const start = inicio?.trim();
  const end = fim?.trim();
  if (start && rack < start) return false;
  if (end && rack > end) return false;
  return true;
}

export function normalizeEndereco(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function enderecosConferem(
  informado: string,
  designado: string,
): boolean {
  const a = normalizeEndereco(informado);
  const b = normalizeEndereco(designado);
  return a.length > 0 && b.length > 0 && a === b;
}

const OPEN_RECONTAGEM_DEMANDA_STATUSES: DemandaContagemStatus[] = [
  'aguardando_inicio',
  'em_andamento',
];

export function isDemandaRecontagemAberta(
  status: DemandaContagemStatus,
): boolean {
  return OPEN_RECONTAGEM_DEMANDA_STATUSES.includes(status);
}
