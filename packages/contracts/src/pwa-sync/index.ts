import { z } from 'zod';

// ---------------------------------------------------------------------------
// Patch item schemas — shared between PWA and API
// ---------------------------------------------------------------------------

export const ChecklistPhotoMediaIdsSchema = z.object({
  lacre: z.array(z.string()).optional(),
  bauFechado: z.array(z.string()).optional(),
  bauAberto: z.array(z.string()).optional(),
  extras: z.array(z.string()).optional(),
});
export type ChecklistPhotoMediaIds = z.infer<typeof ChecklistPhotoMediaIdsSchema>;

export const ChecklistPatchSchema = z.object({
  clientChecklistId: z.string().uuid(),
  dockId: z.string().min(1),
  dock: z.string().optional(),
  lacre: z.string().optional(),
  tempBau: z.number().optional(),
  tempProduto: z.number().optional(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().optional(),
  photoCount: z.number().int().nonnegative().optional(),
  photoMediaIds: ChecklistPhotoMediaIdsSchema.optional(),
  responsavelId: z.number().int().optional(),
});
export type ChecklistPatch = z.infer<typeof ChecklistPatchSchema>;

export const ConferenciaPatchItemSchema = z
  .object({
    clientConferenceId: z.string().uuid(),
    produtoId: z.string().min(1).optional(),
    sku: z.string().optional(),
    quantidadeRecebida: z.number().optional(),
    unidadeMedida: z.string().min(1).optional(),
    loteRecebido: z.string().optional(),
    validade: z.string().optional(),
    pesoRecebido: z.number().optional(),
    etiquetaCodigo: z.string().optional(),
    unitizadorCodigo: z.string().optional(),
    isPvarBox: z.boolean().optional(),
    conferidoAt: z.string(),
    serverItemId: z.string().uuid().optional(),
    serverPesagemId: z.string().uuid().optional(),
    deletedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deletedAt) {
      return;
    }

    if (!data.produtoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'produtoId é obrigatório para conferências ativas',
        path: ['produtoId'],
      });
    }

    if (data.quantidadeRecebida == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'quantidadeRecebida é obrigatória para conferências ativas',
        path: ['quantidadeRecebida'],
      });
    }

    if (!data.unidadeMedida) {
      ctx.addIssue({
        code: 'custom',
        message: 'unidadeMedida é obrigatória para conferências ativas',
        path: ['unidadeMedida'],
      });
    }
  });
export type ConferenciaPatchItem = z.infer<typeof ConferenciaPatchItemSchema>;

export const AvariaPatchItemSchema = z.object({
  clientDamageId: z.string().uuid(),
  produtoId: z.string().optional(),
  sku: z.string().optional(),
  tipo: z.string().min(1),
  natureza: z.string().min(1),
  causa: z.string().min(1),
  quantidadeCaixas: z.number().int().nonnegative(),
  quantidadeUnidades: z.number().int().nonnegative(),
  lote: z.string().optional(),
  photoCount: z.number().int().nonnegative().optional(),
  mediaIds: z.array(z.string()).optional(),
  replicarParaTodos: z.boolean().optional(),
  skusAlvo: z.array(z.string()).optional(),
  serverAvariaId: z.string().uuid().optional(),
  deletedAt: z.string().optional(),
});
export type AvariaPatchItem = z.infer<typeof AvariaPatchItemSchema>;

export const TemperaturaPatchItemSchema = z.object({
  etapa: z.enum(['inicio', 'meio', 'fim']),
  temperatura: z.number(),
});
export type TemperaturaPatchItem = z.infer<typeof TemperaturaPatchItemSchema>;

export const ImpedimentoPatchSchema = z.object({
  clientImpedimentoId: z.string().uuid(),
  tipo: z.string().min(1),
  descricao: z.string().min(10),
  photoCount: z.number().int().positive(),
  mediaIds: z.array(z.string()).optional(),
  registradoPorId: z.number().int().optional(),
  retomar: z.boolean().optional(),
});
export type ImpedimentoPatch = z.infer<typeof ImpedimentoPatchSchema>;

export const EncerramentoPatchSchema = z.object({
  encerrar: z.literal(true),
  quantidadePaletes: z.number().int().positive().optional(),
  teveSobreposicaoCarga: z.boolean().optional(),
});
export type EncerramentoPatch = z.infer<typeof EncerramentoPatchSchema>;

export const DemandPatchBodySchema = z.object({
  checklist: ChecklistPatchSchema.optional(),
  conferencias: z.array(ConferenciaPatchItemSchema).optional(),
  avarias: z.array(AvariaPatchItemSchema).optional(),
  temperaturas: z.array(TemperaturaPatchItemSchema).optional(),
  impedimento: ImpedimentoPatchSchema.optional(),
  encerramento: EncerramentoPatchSchema.optional(),
});
export type DemandPatchBody = z.infer<typeof DemandPatchBodySchema>;

export const DemandPatchRequestSchema = z.object({
  baseRevision: z.number().int().nonnegative().default(0),
  patch: DemandPatchBodySchema,
});
export type DemandPatchRequest = z.infer<typeof DemandPatchRequestSchema>;

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const SectionCountResultSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
});
export type SectionCountResult = z.infer<typeof SectionCountResultSchema>;

export const DemandPatchAppliedSchema = z.object({
  checklist: z.boolean().optional(),
  conferencias: SectionCountResultSchema.optional(),
  avarias: SectionCountResultSchema.optional(),
  temperaturas: SectionCountResultSchema.optional(),
  impedimento: z.boolean().optional(),
  encerrado: z.boolean().optional(),
});
export type DemandPatchApplied = z.infer<typeof DemandPatchAppliedSchema>;

export const DemandPatchConflictSchema = z.object({
  section: z.string(),
  clientId: z.string().optional(),
  reason: z.string(),
});
export type DemandPatchConflict = z.infer<typeof DemandPatchConflictSchema>;

export const DemandPatchResultSchema = z.object({
  serverRevision: z.number().int().nonnegative(),
  resourceId: z.string().uuid().optional(),
  applied: DemandPatchAppliedSchema,
  conflicts: z.array(DemandPatchConflictSchema).optional(),
  /** clientDamageId → server avaria UUID after patch apply */
  avariaIds: z.record(z.string(), z.string()).optional(),
});
export type DemandPatchResult = z.infer<typeof DemandPatchResultSchema>;
