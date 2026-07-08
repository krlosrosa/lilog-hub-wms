import { z } from 'zod';

export const devolucaoGrupoDescargaStatusSchema = z.enum([
  'rascunho',
  'aguardando_conferencia',
  'em_conferencia',
  'conferida',
  'concluida',
  'cancelada',
]);

export type DevolucaoGrupoDescargaStatus = z.infer<
  typeof devolucaoGrupoDescargaStatusSchema
>;

export const devolucaoItemNaoContabilStatusSchema = z.enum([
  'pendente',
  'conciliado',
  'descartado',
  'gerou_ocorrencia',
]);

export type DevolucaoItemNaoContabilStatus = z.infer<
  typeof devolucaoItemNaoContabilStatusSchema
>;

export const grupoDescargaListItemSchema = z.object({
  id: z.string().uuid(),
  codigoGrupo: z.string(),
  placaDescarga: z.string(),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
  observacao: z.string().nullable(),
  status: devolucaoGrupoDescargaStatusSchema,
  totalDemandas: z.number().int().nonnegative(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
});

export type GrupoDescargaListItem = z.infer<typeof grupoDescargaListItemSchema>;

export const GRUPO_DESCARGA_STATUS_LABELS: Record<
  DevolucaoGrupoDescargaStatus,
  string
> = {
  rascunho: 'Rascunho',
  aguardando_conferencia: 'Aguardando Conferência',
  em_conferencia: 'Em Conferência',
  conferida: 'Conferida',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export function canAgruparDemanda(status: string, grupoDescargaId: string | null): boolean {
  return (
    (status === 'aberta' || status === 'em_analise') && grupoDescargaId === null
  );
}

export function canLiberarGrupoConferencia(
  status: DevolucaoGrupoDescargaStatus,
): boolean {
  return status === 'aguardando_conferencia';
}

export function canConcluirGrupo(status: DevolucaoGrupoDescargaStatus): boolean {
  return status === 'conferida';
}
