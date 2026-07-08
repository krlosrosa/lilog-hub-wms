import { z } from 'zod';

export const localizacaoStatusSchema = z.enum(['normal', 'critico']);

export type LocalizacaoStatus = z.infer<typeof localizacaoStatusSchema>;

export const tipoEstoqueSchema = z.enum(['picking', 'aereo']);

export type TipoEstoque = z.infer<typeof tipoEstoqueSchema>;

export type FiltroTipoEstoque = 'todos' | TipoEstoque;

export const TIPO_ESTOQUE_LABELS: Record<TipoEstoque, string> = {
  picking: 'Picking',
  aereo: 'Aéreo',
};

/** Ordem de ressuprimento ativa (palete completo) — apenas em picking. */
export const ordemRessuprimentoSchema = z.object({
  ordemId: z.string(),
  prioridadeSolicitada: z.boolean().optional(),
});

export type OrdemRessuprimento = z.infer<typeof ordemRessuprimentoSchema>;

export type PrioridadeRessuprimentoDraft = {
  localizacaoId: string;
  endereco: string;
  produtoNome: string;
  sku: string;
  ordemId: string;
  prioridadeJaSolicitada: boolean;
};

export type RessuprimentoSolicitacaoDraft = {
  localizacaoId: string;
  endereco: string;
  produtoNome: string;
  sku: string;
  unidade: string;
  quantidadeAtual: number;
};

export const localizacaoSchema = z.object({
  id: z.string(),
  endereco: z.string(),
  zona: z.string(),
  tipo: tipoEstoqueSchema,
  quantidade: z.number().int().min(0),
  lote: z.string().optional(),
  status: localizacaoStatusSchema,
  alertaLabel: z.string().optional(),
  ordemRessuprimento: ordemRessuprimentoSchema.optional(),
});

export type Localizacao = z.infer<typeof localizacaoSchema>;

export const produtoResultSchema = z.object({
  produtoId: z.string(),
  nome: z.string(),
  sku: z.string(),
  categoria: z.string(),
  estoqueTotal: z.number().int().min(0),
  reservado: z.number().int().min(0),
  unidade: z.string().default('CX'),
  localizacoes: z.array(localizacaoSchema),
});

export type ProdutoResult = z.infer<typeof produtoResultSchema>;

export const consultaProdutoQuerySchema = z.object({
  sku: z.string().min(1, 'Informe o SKU ou escaneie o código'),
});

export type ConsultaProdutoQuery = z.infer<typeof consultaProdutoQuerySchema>;
