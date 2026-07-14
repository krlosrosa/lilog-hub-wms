import { z } from 'zod';

import type { ProcessStatus } from '@lilog/contracts';
import type { ParametrosRecebimentoConferencia } from '@/features/recebimento/types/recebimento.schema';

// ---------------------------------------------------------------------------
// Re-export contract types used by the UI layer
// ---------------------------------------------------------------------------
export type { ProcessStatus };

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export const bootstrapStepSchema = z.enum([
  'session',
  'catalog',
  'reference-data',
  'package',
  'snapshot',
  'media',
  'done',
]);

export type BootstrapStep = z.infer<typeof bootstrapStepSchema>;

export interface BootstrapProgress {
  step: BootstrapStep;
  stepIndex: number;
  totalSteps: number;
  message: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Checklist form schemas (UI input)
// ---------------------------------------------------------------------------

export const checklistFormV2Schema = z.object({
  dock: z.string().min(1, 'Selecione a doca'),
  lacre: z.string().min(1, 'Informe o número do lacre'),
  tempBau: z.coerce.number().optional(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().optional(),
});

export type ChecklistFormV2 = z.infer<typeof checklistFormV2Schema>;

// ---------------------------------------------------------------------------
// Damage form schema
// ---------------------------------------------------------------------------

export const damageFormSchema = z.object({
  sku: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  quantidadeCaixa: z.number().int().min(0).default(0),
  quantidadeUnidade: z.number().int().min(0).default(0),
  motivo: z.string().optional(),
  tipo: z.string().min(1, 'Selecione o tipo'),
  natureza: z.string().min(1, 'Selecione a natureza'),
  causa: z.string().min(1, 'Selecione a causa'),
  lote: z.string().optional(),
  replicarParaTodosConferidos: z.boolean().optional(),
});

export type DamageForm = z.infer<typeof damageFormSchema>;

export const TIPO_IMPEDIMENTO_OPTIONS = [
  { id: 'carreta_tombada', label: 'Carreta tombada' },
  { id: 'veiculo_avariado', label: 'Veículo avariado' },
  { id: 'condicao_insegura', label: 'Condição insegura' },
  { id: 'acidente', label: 'Acidente' },
  { id: 'outro', label: 'Outro' },
] as const;

export const impedimentoFormSchema = z.object({
  tipo: z.string().min(1, 'Selecione o tipo de impedimento'),
  descricao: z.string().min(10, 'Descreva o impedimento com ao menos 10 caracteres'),
});

export type ImpedimentoForm = z.infer<typeof impedimentoFormSchema>;

export type SkuItemFilterV2 = 'all' | 'pendente' | 'divergencia' | 'avaria';

export const SKU_ITEM_FILTERS_V2: readonly { id: SkuItemFilterV2; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'divergencia', label: 'Divergência' },
  { id: 'avaria', label: 'Avaria' },
] as const;

// ---------------------------------------------------------------------------
// Divergencia (computed locally from expected vs conferenced)
// ---------------------------------------------------------------------------

export interface DivergenciaItem {
  sku: string;
  description: string;
  expectedQuantity: number;
  conferencedQuantity: number;
  conferidoCaixa?: number;
  conferidoUnidade?: number;
  conferidoLabel?: string;
  delta: number;
  status: 'ok' | 'falta' | 'sobra' | 'nao_conferido';
  isNovo?: boolean;
  hasAvaria?: boolean;
}

// ---------------------------------------------------------------------------
// Product catalog (API response item, used by search hooks)
// ---------------------------------------------------------------------------

export const productItemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  description: z.string(),
  unidadeId: z.string(),
  empresa: z.string().default(''),
  categoria: z.string().default(''),
  tipo: z.string().default(''),
  ean: z.string().default(''),
  dum: z.string().default(''),
  shelfLife: z.number().default(0),
  pesoBrutoUnidade: z.number().default(0),
  pesoBrutoCaixa: z.number().default(0),
  pesoBrutoPalete: z.number().default(0),
  pesoLiquidoUnidade: z.number().default(0),
  pesoLiquidoCaixa: z.number().default(0),
  pesoLiquidoPalete: z.number().default(0),
  unidadesPorCaixa: z.number().default(0),
  caixasPorPalete: z.number().default(0),
  controlaLote: z.boolean().default(false),
  controlaValidade: z.boolean().default(false),
  controlaPeso: z.boolean().default(false),
  pesoVariavel: z.boolean().default(false),
  serverRevision: z.number().default(0),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),
});

export type ProductItem = z.infer<typeof productItemSchema>;

// ---------------------------------------------------------------------------
// Product dataset (paginated API response)
// ---------------------------------------------------------------------------

export interface ProductDataset {
  items: ProductItem[];
  nextCursor?: string;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export interface ReferenceData {
  docas?: Array<{ id: string; label: string }>;
  damageMotivos?: Array<{ id: string; label: string }>;
  configuracaoConferencia?: ParametrosRecebimentoConferencia;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Process list (paginated)
// ---------------------------------------------------------------------------

export interface ProcessHeaderItem {
  demandId: string;
  unidadeId: string;
  situacao: string;
  preRecebimentoSituacao: string;
  serverRevision: number;
  updatedAt: string;
  tombstone: boolean;
  supplier?: string;
  dock?: string | null;
  arrival?: string;
  placa?: string | null;
  conferente?: string | null;
  atribuidoAMim?: boolean;
}

export interface ProcessList {
  items: ProcessHeaderItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Recebimento package (API response — full demand data)
// ---------------------------------------------------------------------------

export const recebimentoPackageSchema = z.object({
  demandId: z.string(),
  revision: z.number(),
  preRecebimento: z.object({
    id: z.string(),
    unidadeId: z.string(),
    situacao: z.string(),
    itens: z.array(z.object({
      produtoId: z.string(),
      quantidadeEsperada: z.number(),
      unidadeMedida: z.string(),
    })).optional(),
  }).optional(),
  recebimento: z.object({
    id: z.string(),
    situacao: z.string(),
  }).optional(),
  checklist: z.unknown().optional(),
  temperaturas: z.array(z.object({
    etapa: z.string(),
    temperatura: z.number(),
  })).optional(),
  avarias: z.unknown().optional(),
  generatedAt: z.string().optional(),
});

export type RecebimentoPackage = z.infer<typeof recebimentoPackageSchema>;

// ---------------------------------------------------------------------------
// Snapshot (for pull/reconciliation)
// ---------------------------------------------------------------------------

export interface RecebimentoSnapshot {
  demandId: string;
  revision: number;
  situacao?: string;
  expectedItems?: Array<{
    id: string;
    demandId: string;
    produtoId: string;
    sku: string;
    descricao: string;
    quantidadeEsperada: number;
    unidadeMedida: string;
    updatedAt: number;
  }>;
  conferences?: Array<Record<string, unknown>>;
  /** Campo retornado pela API de snapshot */
  conferencias?: Array<Record<string, unknown>>;
  damages?: Array<Record<string, unknown>>;
  /** Campo retornado pela API de snapshot */
  avarias?: Array<Record<string, unknown>>;
  /** Checklist singular retornado pela API de snapshot/package */
  checklist?: Record<string, unknown> | null;
  checklists?: Array<Record<string, unknown>>;
  temperatures?: Array<Record<string, unknown>>;
  /** Campo retornado pela API de snapshot/package */
  temperaturas?: Array<{ etapa: string; temperatura: number }>;
}
