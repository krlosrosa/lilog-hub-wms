import { z } from 'zod';

export const transportSchema = z.object({
  id: z.string(),
  placa: z.string(),
  tonelagem: z.number().positive(),
  transportadora: z.string().optional(),
});

export type Transport = z.infer<typeof transportSchema>;

export const groupingRuleKeySchema = z.enum([
  'segregate',
  'byClient',
  'byTransport',
  'byShipment',
]);

export type GroupingRuleKey = z.infer<typeof groupingRuleKeySchema>;

export const GROUPING_RULE_LABELS: Record<GroupingRuleKey, string> = {
  segregate: 'Segregar Cliente',
  byClient: 'Agrupar por Cliente (Multi-Mapa)',
  byTransport: 'Agrupar por Transporte',
  byShipment: 'Agrupar por Remessa',
};

export const GROUPING_RULE_ITEM_LABELS: Record<
  Exclude<GroupingRuleKey, 'segregate'>,
  string
> = {
  byClient: 'Clientes',
  byTransport: 'Transportes',
  byShipment: 'Remessas',
};

export const groupingGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Informe o nome do grupo'),
  items: z.array(z.string()).min(1, 'Adicione ao menos um item'),
  collapsed: z.boolean(),
});

export type GroupingGroup = z.infer<typeof groupingGroupSchema>;

export const segregateRuleSchema = z.object({
  enabled: z.boolean(),
  collapsed: z.boolean(),
  items: z.array(z.string()),
});

export type SegregateRule = z.infer<typeof segregateRuleSchema>;

export const groupRuleSchema = z.object({
  enabled: z.boolean(),
  collapsed: z.boolean(),
  groups: z.array(groupingGroupSchema),
});

export type GroupRule = z.infer<typeof groupRuleSchema>;

export const groupingRulesSchema = z.object({
  segregate: segregateRuleSchema,
  byClient: groupRuleSchema,
  byTransport: groupRuleSchema,
  byShipment: groupRuleSchema,
});

export type GroupingRules = z.infer<typeof groupingRulesSchema>;

export const palletizationTypeSchema = z.enum(['full', 'units']);

export type PalletizationType = z.infer<typeof palletizationTypeSchema>;

export const PALLETIZATION_TYPE_LABELS: Record<PalletizationType, string> = {
  full: 'Palete Full',
  units: 'Unidades',
};

export const palletizationConfigSchema = z.object({
  enabled: z.boolean(),
  type: palletizationTypeSchema,
  percentual: z.number().min(0).max(100),
  linhas: z.number().int().min(1),
  quantidadeUnidades: z.number().int().min(1),
});

export type PalletizationConfig = z.infer<typeof palletizationConfigSchema>;

export const printTypeSchema = z.enum(['cliente', 'transporte']);

export type PrintType = z.infer<typeof printTypeSchema>;

export const PRINT_TYPE_LABELS: Record<PrintType, string> = {
  cliente: 'Por Cliente',
  transporte: 'Por Transporte',
};

export const conferenceClassificationFieldSchema = z.enum([
  'cliente',
  'transporte',
  'remessa',
  'pedido',
  'rota',
  'operador',
]);

export type ConferenceClassificationField = z.infer<
  typeof conferenceClassificationFieldSchema
>;

export const CONFERENCE_CLASSIFICATION_LABELS: Record<
  ConferenceClassificationField,
  string
> = {
  cliente: 'Cliente',
  transporte: 'Transporte',
  remessa: 'Remessa',
  pedido: 'Pedido / NF',
  rota: 'Rota',
  operador: 'Operador',
};

export const printConfigSchema = z.object({
  tipoImpressao: printTypeSchema,
  conferenciaSegueSeparacao: z.boolean(),
  campoClassificacaoConferencia: conferenceClassificationFieldSchema,
});

export type PrintConfig = z.infer<typeof printConfigSchema>;

export const mapaSeparacaoPreviewLineSchema = z.object({
  sequencia: z.number().int().min(1),
  endereco: z.string(),
  sku: z.string(),
  produto: z.string(),
  quantidade: z.number().int().min(1),
});

export type MapaSeparacaoPreviewLine = z.infer<
  typeof mapaSeparacaoPreviewLineSchema
>;

export const mapaSeparacaoPreviewSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  transporte: z.string().optional(),
  agrupamento: z.string(),
  paletizacao: z.string(),
  tipoImpressao: z.string(),
  conferencia: z.string(),
  linhas: z.array(mapaSeparacaoPreviewLineSchema),
  totalLinhas: z.number().int().min(0),
});

export type MapaSeparacaoPreview = z.infer<typeof mapaSeparacaoPreviewSchema>;
