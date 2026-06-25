import { z } from 'zod';

export const checklistAreaSchema = z.enum([
  'docas',
  'corredores',
  'picking',
  'refeitorio',
]);

export type ChecklistArea = z.infer<typeof checklistAreaSchema>;

export const areaFilterSchema = z.enum([
  'all',
  'docas',
  'corredores',
  'picking',
  'refeitorio',
]);

export type AreaFilter = z.infer<typeof areaFilterSchema>;

export const checklistItemIconSchema = z.enum([
  'pallet',
  'view_column',
  'shopping_basket',
  'restaurant',
  'door_open',
  'delete',
]);

export type ChecklistItemIcon = z.infer<typeof checklistItemIconSchema>;

export const checklistItemSchema = z.object({
  id: z.string(),
  area: checklistAreaSchema,
  title: z.string(),
  description: z.string(),
  icon: checklistItemIconSchema,
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistConformidadeSchema = z.enum([
  'pendente',
  'conforme',
  'nao_conforme',
]);

export type ChecklistConformidade = z.infer<typeof checklistConformidadeSchema>;

export const CONFORMIDADE_LABELS: Record<ChecklistConformidade, string> = {
  pendente: 'Pendente',
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
};

export const checklistItemStateSchema = z.object({
  conformidade: checklistConformidadeSchema,
  observacao: z.string(),
});

export type ChecklistItemState = z.infer<typeof checklistItemStateSchema>;

export const divergenciaTipoSchema = z.enum(['quantidade', 'dano']);

export type DivergenciaTipo = z.infer<typeof divergenciaTipoSchema>;

export const divergenciaSchema = z.object({
  id: z.string(),
  sku: z.string(),
  nome: z.string(),
  tipo: divergenciaTipoSchema,
  valor: z.string(),
  localizacao: z.string(),
});

export type Divergencia = z.infer<typeof divergenciaSchema>;

export const checklistStatusItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  concluido: z.boolean(),
});

export type ChecklistStatusItem = z.infer<typeof checklistStatusItemSchema>;

export const passagemBastaoResumoSchema = z.object({
  pin: z.string().min(4, 'Informe seu PIN ou senha'),
  hasSignature: z.boolean().refine((value) => value, {
    message: 'Assinatura digital obrigatória',
  }),
});

export type PassagemBastaoResumoForm = z.infer<typeof passagemBastaoResumoSchema>;

export const passagemBastaoSchema = z.object({
  protocolo: z.string(),
  operadorReceptor: z.string(),
  divergencias: z.array(divergenciaSchema),
  progressoChecklist: z.number().min(0).max(100),
  statusItens: z.array(checklistStatusItemSchema),
  evidencias: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      alt: z.string(),
    }),
  ),
});

export type PassagemBastao = z.infer<typeof passagemBastaoSchema>;
