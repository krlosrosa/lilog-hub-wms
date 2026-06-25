import { z } from 'zod';

export const missionStatusSchema = z.enum(['active', 'queued', 'locked']);

export type MissionStatus = z.infer<typeof missionStatusSchema>;

export const missionPrioritySchema = z.enum(['alta', 'critica', 'normal']);

export type MissionPriority = z.infer<typeof missionPrioritySchema>;

export const activeMissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  itemDescription: z.string(),
  status: missionStatusSchema,
  priority: missionPrioritySchema.optional(),
  elapsedSeconds: z.number().int().nonnegative(),
  estimatedSeconds: z.number().int().positive(),
  icon: z.enum(['move_to_inbox', 'keyboard_tab', 'forklift']),
});

export type ActiveMission = z.infer<typeof activeMissionSchema>;

export const alertSeveritySchema = z.enum(['error', 'warning', 'info']);

export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const wmsAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: alertSeveritySchema,
  timeAgo: z.string(),
});

export type WmsAlert = z.infer<typeof wmsAlertSchema>;

export const productivityKpisSchema = z.object({
  tasksCompleted: z.number().int().nonnegative(),
  tasksGoal: z.number().int().positive(),
  tasksProgressPercent: z.number().min(0).max(100),
  tasksDeltaPercent: z.number(),
  averageTimePerUnit: z.string(),
  qualityPercent: z.number().min(0).max(100),
  qualityLevel: z.string(),
});

export type ProductivityKpis = z.infer<typeof productivityKpisSchema>;

export const shiftStatusSchema = z.object({
  duration: z.string(),
  weightMovedKg: z.number().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  nodeId: z.string(),
});

export type ShiftStatus = z.infer<typeof shiftStatusSchema>;

export const quickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortcut: z.string(),
  href: z.string().optional(),
  icon: z.enum(['forklift', 'inventory', 'print', 'emergency']),
  variant: z.enum(['default', 'destructive']).default('default'),
});

export type QuickAction = z.infer<typeof quickActionSchema>;

export const stockOriginStatusSchema = z.enum(['disponivel', 'vencimento_proximo']);

export type StockOriginStatus = z.infer<typeof stockOriginStatusSchema>;

export const stockOriginSchema = z.object({
  id: z.string(),
  address: z.string(),
  lotId: z.string(),
  quantity: z.number().int().nonnegative(),
  quantityLabel: z.string(),
  status: stockOriginStatusSchema,
});

export type StockOrigin = z.infer<typeof stockOriginSchema>;

export const ressuprimentoPrioritySchema = z.enum(['alta', 'critica', 'backlog']);

export type RessuprimentoPriority = z.infer<typeof ressuprimentoPrioritySchema>;

export const ressuprimentoFormSchema = z.object({
  skuSearch: z.string().min(1, 'Informe o SKU ou produto'),
  selectedOriginAddress: z.string().min(1, 'Selecione o endereço de origem'),
  destinationAddress: z.string().min(1, 'Informe o endereço de destino'),
  priority: ressuprimentoPrioritySchema,
});

export type RessuprimentoForm = z.infer<typeof ressuprimentoFormSchema>;

export const DEFAULT_RESSUPRIMENTO_FORM: RessuprimentoForm = {
  skuSearch: 'SKU-8829-X (Motor Elétrico 40cv)',
  selectedOriginAddress: 'EST-02-A',
  destinationAddress: 'PK-04-122-B',
  priority: 'critica',
};

export const RESSUPRIMENTO_PRIORITY_LABELS: Record<RessuprimentoPriority, string> = {
  alta: 'ALTA',
  critica: 'CRÍTICA (RUPTURA)',
  backlog: 'BACKLOG NORMAL',
};

export const STOCK_ORIGIN_STATUS_LABELS: Record<StockOriginStatus, string> = {
  disponivel: 'Disponível',
  vencimento_proximo: 'Lote Próximo Venc.',
};

export const PICKING_SUGGESTIONS = ['PK-04-122-B', 'PK-04-125-A'] as const;

export const replenishmentStatusSchema = z.enum([
  'critical',
  'warning',
  'in_mission',
  'ok',
]);

export type ReplenishmentStatus = z.infer<typeof replenishmentStatusSchema>;

export const replenishmentItemSchema = z.object({
  id: z.string(),
  address: z.string(),
  productName: z.string(),
  sku: z.string(),
  balance: z.number().int().nonnegative(),
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  occupancyPercent: z.number().min(0).max(100),
  pending: z.number().int().nonnegative(),
  suggested: z.number().int().nonnegative(),
  suggestedLabel: z.string().optional(),
  status: replenishmentStatusSchema,
  missionId: z.string().optional(),
  canGenerateMission: z.boolean().default(true),
});

export type ReplenishmentItem = z.infer<typeof replenishmentItemSchema>;

export const pickingKpiVariantSchema = z.enum([
  'critical',
  'warning',
  'active',
  'neutral',
]);

export type PickingKpiVariant = z.infer<typeof pickingKpiVariantSchema>;

export const pickingKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  variant: pickingKpiVariantSchema,
  badge: z.string(),
  subtext: z.string(),
  icon: z.enum(['error', 'warning', 'pending', 'inventory']),
});

export type PickingKpi = z.infer<typeof pickingKpiSchema>;

export const gestaoPickingFiltersSchema = z.object({
  search: z.string(),
  onlyCritical: z.boolean(),
  page: z.number().int().positive(),
});

export type GestaoPickingFilters = z.infer<typeof gestaoPickingFiltersSchema>;

export const DEFAULT_GESTAO_PICKING_FILTERS: GestaoPickingFilters = {
  search: '',
  onlyCritical: false,
  page: 1,
};

export const GESTAO_PICKING_PAGE_SIZE = 10;
