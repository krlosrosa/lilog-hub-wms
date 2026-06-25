import { z } from 'zod';

export const ordemTabelaEmpresaItemSchema = z.enum([
  'empresa',
  'categoria',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
  'peso',
]);

export type OrdemTabelaEmpresaItem = z.infer<typeof ordemTabelaEmpresaItemSchema>;

export const ORDEM_TABELA_EMPRESA_LABELS: Record<OrdemTabelaEmpresaItem, string> = {
  empresa: 'Empresa',
  categoria: 'Categoria',
  quantidade_unidade: 'Qtd. Unidade',
  quantidade_caixa: 'Qtd. Caixa',
  quantidade_palete: 'Qtd. Palete',
  peso: 'Peso (kg)',
};

export const ALL_ORDEM_TABELA_EMPRESA_ITEMS = ordemTabelaEmpresaItemSchema.options;

export const ordemTabelaClientesItemSchema = z.enum([
  'cliente',
  'cidade',
  'peso',
  'volume',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
]);

export type OrdemTabelaClientesItem = z.infer<typeof ordemTabelaClientesItemSchema>;

export const ORDEM_TABELA_CLIENTES_LABELS: Record<OrdemTabelaClientesItem, string> = {
  cliente: 'Cliente',
  cidade: 'Cidade',
  peso: 'Peso (kg)',
  volume: 'Volume (m³)',
  quantidade_unidade: 'Qtd. Unidade',
  quantidade_caixa: 'Qtd. Caixa',
  quantidade_palete: 'Qtd. Palete',
};

export const ALL_ORDEM_TABELA_CLIENTES_ITEMS = ordemTabelaClientesItemSchema.options;

export const tabelaCarregamentoTipoSchema = z.enum(['empresa', 'clientes']);

export type TabelaCarregamentoTipo = z.infer<typeof tabelaCarregamentoTipoSchema>;

export const TABELA_CARREGAMENTO_TIPO_LABELS: Record<TabelaCarregamentoTipo, string> = {
  empresa: 'Lista por Empresa',
  clientes: 'Lista de Clientes',
};

export const opcoesTabelasCarregamentoSchema = z.object({
  exibirTabelaEmpresa: z.boolean(),
  exibirTabelaClientes: z.boolean(),
  ordemTabelaEmpresa: z.array(ordemTabelaEmpresaItemSchema),
  ordemTabelaClientes: z.array(ordemTabelaClientesItemSchema),
});

export type OpcoesTabelasCarregamento = z.infer<typeof opcoesTabelasCarregamentoSchema>;

export const DEFAULT_OPCOES_TABELAS_CARREGAMENTO: OpcoesTabelasCarregamento = {
  exibirTabelaEmpresa: true,
  exibirTabelaClientes: true,
  ordemTabelaEmpresa: [...ALL_ORDEM_TABELA_EMPRESA_ITEMS],
  ordemTabelaClientes: [...ALL_ORDEM_TABELA_CLIENTES_ITEMS],
};

const COLUNAS_NUMERICAS_EMPRESA = new Set<OrdemTabelaEmpresaItem>([
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
  'peso',
]);

const COLUNAS_NUMERICAS_CLIENTES = new Set<OrdemTabelaClientesItem>([
  'peso',
  'volume',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
]);

export function labelColunaEmpresa(item: OrdemTabelaEmpresaItem): string {
  return ORDEM_TABELA_EMPRESA_LABELS[item];
}

export function labelColunaClientes(item: OrdemTabelaClientesItem): string {
  return ORDEM_TABELA_CLIENTES_LABELS[item];
}

export function colunaEmpresaAlinhamento(
  item: OrdemTabelaEmpresaItem,
): 'left' | 'right' {
  return COLUNAS_NUMERICAS_EMPRESA.has(item) ? 'right' : 'left';
}

export function colunaClientesAlinhamento(
  item: OrdemTabelaClientesItem,
): 'left' | 'right' {
  return COLUNAS_NUMERICAS_CLIENTES.has(item) ? 'right' : 'left';
}
