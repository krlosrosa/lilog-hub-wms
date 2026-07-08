import { z } from 'zod';

export const ProdutoCategoriaSchema = z.enum([
  'seco',
  'refrigerado',
  'queijo',
]);

export type ProdutoCategoria = z.infer<typeof ProdutoCategoriaSchema>;

export const produtoListaItemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  subtitulo: z.string(),
  ean: z.string().optional(),
  categoria: ProdutoCategoriaSchema,
  empresa: z.string(),
});

export type ProdutoListaItem = z.infer<typeof produtoListaItemSchema>;

export const FiltroCategoriaProdutoSchema = z.enum([
  'todos',
  'seco',
  'refrigerado',
  'queijo',
]);

export type FiltroCategoriaProduto = z.infer<
  typeof FiltroCategoriaProdutoSchema
>;

export const FILTRO_PRODUTO_LABELS: Record<FiltroCategoriaProduto, string> = {
  todos: 'Todos',
  seco: 'Seco',
  refrigerado: 'Refrigerado',
  queijo: 'Queijo',
};

export const CATEGORIA_LABELS: Record<ProdutoCategoria, string> = {
  seco: 'Seco',
  refrigerado: 'Refrigerado',
  queijo: 'Queijo',
};

const PRODUTO_CATEGORIA_VALUES = ProdutoCategoriaSchema.options;

export function isProdutoCategoria(value: string): value is ProdutoCategoria {
  return (PRODUTO_CATEGORIA_VALUES as readonly string[]).includes(value);
}

/** Normaliza categorias legadas do banco para o enum atual. */
export function normalizeProdutoCategoria(value: string): ProdutoCategoria {
  if (isProdutoCategoria(value)) {
    return value;
  }

  const legacyMap: Record<string, ProdutoCategoria> = {
    alimentos: 'seco',
    limpeza: 'seco',
    logistica: 'seco',
    vestuario: 'seco',
    outros: 'seco',
    pereciveis: 'refrigerado',
    eletronicos: 'seco',
  };

  return legacyMap[value] ?? 'seco';
}

export function getCategoriaLabel(value: string): string {
  return CATEGORIA_LABELS[normalizeProdutoCategoria(value)];
}

export const FILTROS_PRODUTO: readonly FiltroCategoriaProduto[] = [
  'todos',
  'seco',
  'refrigerado',
  'queijo',
] as const;
