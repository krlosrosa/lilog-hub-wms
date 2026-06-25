import { z } from 'zod';

export const inventarioStatusSchema = z.enum([
  'concluido',
  'em-progresso',
  'agendado',
]);

export type InventarioStatus = z.infer<typeof inventarioStatusSchema>;

export const inventarioTipoSchema = z.enum(['ciclo', 'geral']);

export type InventarioTipo = z.infer<typeof inventarioTipoSchema>;

export const inventarioListaItemSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  dataLabel: z.string(),
  responsavelNome: z.string(),
  responsavelIniciais: z.string(),
  tipo: inventarioTipoSchema,
  /** null quando ainda sem acurácia */
  acuraciaPercent: z.number().min(0).max(100).nullable(),
  status: inventarioStatusSchema,
  destaque: z.boolean().optional(),
});

export type InventarioListaItem = z.infer<typeof inventarioListaItemSchema>;

export const inventarioKpiSchema = z.object({
  acuraciaGlobal: z.number(),
  acuraciaDeltaPercent: z.number(),
  itensInventariados: z.number(),
  itensMeta: z.number(),
  divergenciasTotal: z.number(),
  divergenciasDelta: z.number(),
  statusAtualLabel: z.string(),
  tempoEstimadoLabel: z.string().nullable(),
});

export type InventarioKpi = z.infer<typeof inventarioKpiSchema>;

export const trendMesSchema = z.object({
  mes: z.string(),
  valorPercent: z.number(),
});

export type TrendMes = z.infer<typeof trendMesSchema>;

/** Demandas de contagem (passo 2 do fluxo) */
export const demandaContagemTipoSchema = z.enum(['cega', 'validacao']);

export type DemandaContagemTipo = z.infer<typeof demandaContagemTipoSchema>;

export const demandaContagemStatusSchema = z.enum(['aguardando-inicio']);

export type DemandaContagemStatus = z.infer<typeof demandaContagemStatusSchema>;

export const demandaContagemItemSchema = z.object({
  id: z.string(),
  localTitulo: z.string(),
  localSubtitulo: z.string(),
  responsavelNome: z.string(),
  responsavelAvatarUrl: z.string().optional(),
  tipo: demandaContagemTipoSchema,
  status: demandaContagemStatusSchema,
  iconName: z.enum(['grid', 'snow']),
});

export type DemandaContagemItem = z.infer<typeof demandaContagemItemSchema>;

export const demandaNovaFormSchema = z.object({
  local: z.string().min(1, 'Informe o local ou setor'),
  responsavelId: z.string().min(1, 'Selecione um responsável'),
  tipo: demandaContagemTipoSchema,
});

export type DemandaNovaFormValues = z.infer<typeof demandaNovaFormSchema>;

export const demandaPrioridadeSchema = z.enum([
  'baixa',
  'media',
  'alta',
  'critica',
]);

export type DemandaPrioridade = z.infer<typeof demandaPrioridadeSchema>;

export const demandaNovaFullFormSchema = z
  .object({
    nome: z.string().min(1, 'Informe o nome ou ID da demanda'),
    prioridade: demandaPrioridadeSchema,
    statusAtivo: z.boolean(),
    tipo: demandaContagemTipoSchema,
    enderecoIds: z
      .array(z.string().uuid())
      .min(1, 'Selecione pelo menos um endereço de contagem'),
    zonas: z.array(z.string()),
    rackInicio: z.string(),
    rackFim: z.string(),
    categorias: z.array(z.string()),
    skuBusca: z.string(),
    responsavelId: z.string().min(1, 'Selecione o responsável'),
    observacoes: z.string(),
    alertaFragilidade: z.boolean(),
  });

export type DemandaNovaFullFormValues = z.infer<typeof demandaNovaFullFormSchema>;

export const DEMANDA_PRIORIDADE_LABELS: Record<DemandaPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const INVENTARIO_STATUS_LABELS: Record<InventarioStatus, string> = {
  concluido: 'Concluído',
  'em-progresso': 'Em progresso',
  agendado: 'Agendado',
};

export const INVENTARIO_TIPO_LABELS: Record<InventarioTipo, string> = {
  ciclo: 'Ciclo',
  geral: 'Geral',
};
