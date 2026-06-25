import { z } from 'zod';

export const areaLimpezaStatusSchema = z.enum(['limpo', 'sujo', 'pendente']);

export type AreaLimpezaStatus = z.infer<typeof areaLimpezaStatusSchema>;

export const rackStatusSchema = z.enum(['ok', 'critico']);

export type RackStatus = z.infer<typeof rackStatusSchema>;

export const evidenciaTipoSchema = z.enum(['antes', 'depois']);

export type EvidenciaTipo = z.infer<typeof evidenciaTipoSchema>;

export const areaChecklistSchema = z.object({
  id: z.string(),
  area: z.string(),
  status: areaLimpezaStatusSchema,
  responsavel: z.string(),
  ultimaAuditoria: z.string(),
});

export type AreaChecklist = z.infer<typeof areaChecklistSchema>;

export const rackItemSchema = z.object({
  id: z.string(),
  setor: z.string(),
  descricao: z.string(),
  status: rackStatusSchema,
  detalhe: z.string(),
});

export type RackItem = z.infer<typeof rackItemSchema>;

export const evidenciaFotoSchema = z.object({
  id: z.string(),
  label: z.string(),
  tipo: evidenciaTipoSchema,
  imageUrl: z.string().url(),
});

export type EvidenciaFoto = z.infer<typeof evidenciaFotoSchema>;

export const handoverNotaSchema = z.object({
  id: z.string(),
  supervisor: z.string(),
  cargo: z.string(),
  turno: z.string(),
  mensagem: z.string(),
  avatarUrl: z.string().url().optional(),
});

export type HandoverNota = z.infer<typeof handoverNotaSchema>;

export const passagemBastaoKpisSchema = z.object({
  indiceLimpezaPercent: z.number().min(0).max(100),
  indiceLimpezaDelta: z.string(),
  zonasCriticas: z.number().int().nonnegative(),
  integridadeLabel: z.string(),
  integridadePercent: z.number().min(0).max(100),
});

export type PassagemBastaoKpis = z.infer<typeof passagemBastaoKpisSchema>;

export const passagemBastaoAuditoriaSchema = z.object({
  auditId: z.string(),
  titulo: z.string(),
  turnoOrigem: z.string(),
  turnoDestino: z.string(),
  data: z.string(),
  horarioInicio: z.string(),
  horarioPrevisto: z.string(),
});

export type PassagemBastaoAuditoria = z.infer<
  typeof passagemBastaoAuditoriaSchema
>;

export const AREA_STATUS_LABELS: Record<AreaLimpezaStatus, string> = {
  limpo: 'Limpo',
  sujo: 'Sujo',
  pendente: 'Pendente',
};

export const DEFAULT_AUDITORIA: PassagemBastaoAuditoria = {
  auditId: 'HS-5521',
  titulo: 'Auditoria de Condição da Unidade',
  turnoOrigem: 'Alpha',
  turnoDestino: 'Bravo',
  data: 'Quarta-feira, 24 de Outubro',
  horarioInicio: '14:00',
  horarioPrevisto: '22:00',
};
