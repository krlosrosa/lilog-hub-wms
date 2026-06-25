import { z } from 'zod';

export const OrdemTabelaEmpresaItemSchema = z.enum([
  'empresa',
  'categoria',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
  'peso',
]);

export type OrdemTabelaEmpresaItem = z.infer<typeof OrdemTabelaEmpresaItemSchema>;

export const ORDEM_TABELA_EMPRESA_LABELS: Record<OrdemTabelaEmpresaItem, string> = {
  empresa: 'Empresa',
  categoria: 'Categoria',
  quantidade_unidade: 'Qtd. Unidade',
  quantidade_caixa: 'Qtd. Caixa',
  quantidade_palete: 'Qtd. Palete',
  peso: 'Peso (kg)',
};

export const OrdemTabelaClientesItemSchema = z.enum([
  'cliente',
  'cidade',
  'peso',
  'volume',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
]);

export type OrdemTabelaClientesItem = z.infer<typeof OrdemTabelaClientesItemSchema>;

export const ORDEM_TABELA_CLIENTES_LABELS: Record<OrdemTabelaClientesItem, string> = {
  cliente: 'Cliente',
  cidade: 'Cidade',
  peso: 'Peso (kg)',
  volume: 'Volume (m³)',
  quantidade_unidade: 'Qtd. Unidade',
  quantidade_caixa: 'Qtd. Caixa',
  quantidade_palete: 'Qtd. Palete',
};

export const OpcoesTabelasCarregamentoSchema = z.object({
  exibirTabelaEmpresa: z.boolean(),
  exibirTabelaClientes: z.boolean(),
  ordemTabelaEmpresa: z.array(OrdemTabelaEmpresaItemSchema),
  ordemTabelaClientes: z.array(OrdemTabelaClientesItemSchema),
});

export type OpcoesTabelasCarregamento = z.infer<
  typeof OpcoesTabelasCarregamentoSchema
>;

export const DEFAULT_OPCOES_TABELAS_CARREGAMENTO: OpcoesTabelasCarregamento = {
  exibirTabelaEmpresa: true,
  exibirTabelaClientes: true,
  ordemTabelaEmpresa: [...OrdemTabelaEmpresaItemSchema.options],
  ordemTabelaClientes: [...OrdemTabelaClientesItemSchema.options],
};

export type LinhaTabelaEmpresaCarregamento = {
  empresa: string;
  categoria: string;
  quantidadeUnidade: number;
  quantidadeCaixa: number;
  quantidadePalete: number;
  pesoKg: number;
};

export type LinhaTabelaClienteCarregamento = {
  codCliente: string;
  cliente: string;
  cidade: string;
  pesoKg: number;
  volumeM3: number;
  quantidadeUnidade: number;
  quantidadeCaixa: number;
  quantidadePalete: number;
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

const CAMPO_VAZIO = '—';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatarNumero(value: number, casas = 0): string {
  if (!Number.isFinite(value)) {
    return CAMPO_VAZIO;
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
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

export function resolverValorColunaEmpresa(
  linha: LinhaTabelaEmpresaCarregamento,
  coluna: OrdemTabelaEmpresaItem,
): string {
  switch (coluna) {
    case 'empresa':
      return linha.empresa;
    case 'categoria':
      return linha.categoria;
    case 'quantidade_unidade':
      return formatarNumero(linha.quantidadeUnidade);
    case 'quantidade_caixa':
      return formatarNumero(linha.quantidadeCaixa);
    case 'quantidade_palete':
      return formatarNumero(linha.quantidadePalete);
    case 'peso':
      return formatarNumero(linha.pesoKg, 3);
    default:
      return CAMPO_VAZIO;
  }
}

export function resolverValorColunaClientes(
  linha: LinhaTabelaClienteCarregamento,
  coluna: OrdemTabelaClientesItem,
): string {
  switch (coluna) {
    case 'cliente':
      return linha.cliente;
    case 'cidade':
      return linha.cidade;
    case 'peso':
      return formatarNumero(linha.pesoKg, 3);
    case 'volume':
      return formatarNumero(linha.volumeM3, 3);
    case 'quantidade_unidade':
      return formatarNumero(linha.quantidadeUnidade);
    case 'quantidade_caixa':
      return formatarNumero(linha.quantidadeCaixa);
    case 'quantidade_palete':
      return formatarNumero(linha.quantidadePalete);
    default:
      return CAMPO_VAZIO;
  }
}

function montarHtmlTabelaCarregamento<T extends string, L>(
  titulo: string,
  linhas: L[],
  ordemColunas: T[],
  labels: Record<T, string>,
  alinhamento: (coluna: T) => 'left' | 'right',
  resolverValor: (linha: L, coluna: T) => string,
): string {
  if (ordemColunas.length === 0 || linhas.length === 0) {
    return '';
  }

  const headerCells = ordemColunas
    .map((coluna) => {
      const align = alinhamento(coluna);
      return `<th style="text-align:${align};padding:3px 4px;border:1px solid #ccc;background:#f4f4f4;font-size:9px;text-transform:uppercase;">${labels[coluna]}</th>`;
    })
    .join('');

  const bodyRows = linhas
    .map((linha) => {
      const cells = ordemColunas
        .map((coluna) => {
          const align = alinhamento(coluna);
          const valor = resolverValor(linha, coluna);
          return `<td style="text-align:${align};padding:3px 4px;border:1px solid #ccc;">${escapeHtml(valor)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<div style="margin-top:10px;"><p style="margin:0 0 4px;font-size:9px;font-weight:bold;text-transform:uppercase;color:#666;">${escapeHtml(titulo)}</p><table style="width:100%;border-collapse:collapse;font-size:10px;color:#222;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

export function montarHtmlTabelaEmpresa(
  linhas: LinhaTabelaEmpresaCarregamento[],
  ordemColunas: OrdemTabelaEmpresaItem[],
): string {
  return montarHtmlTabelaCarregamento(
    'Lista de Carregamento por Empresa',
    linhas,
    ordemColunas,
    ORDEM_TABELA_EMPRESA_LABELS,
    colunaEmpresaAlinhamento,
    resolverValorColunaEmpresa,
  );
}

export function montarHtmlTabelaClientes(
  linhas: LinhaTabelaClienteCarregamento[],
  ordemColunas: OrdemTabelaClientesItem[],
): string {
  return montarHtmlTabelaCarregamento(
    'Lista de Clientes',
    linhas,
    ordemColunas,
    ORDEM_TABELA_CLIENTES_LABELS,
    colunaClientesAlinhamento,
    resolverValorColunaClientes,
  );
}
