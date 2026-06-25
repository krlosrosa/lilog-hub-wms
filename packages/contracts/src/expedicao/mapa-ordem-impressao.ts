import { z } from 'zod';

export const OrdemImpressaoItemSchema = z.enum([
  'endereco',
  'sku',
  'descricao',
  'lote',
  'data_maxima',
  'data_minima',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
  'faixa',
]);

export type OrdemImpressaoItem = z.infer<typeof OrdemImpressaoItemSchema>;

export const ORDEM_IMPRESSAO_LABELS: Record<OrdemImpressaoItem, string> = {
  endereco: 'Endereço',
  sku: 'SKU',
  descricao: 'Descrição',
  lote: 'Lote',
  data_maxima: 'Data Máxima',
  data_minima: 'Data Mínima',
  quantidade_unidade: 'Quantidade Unidade',
  quantidade_caixa: 'Quantidade Caixa',
  quantidade_palete: 'Quantidade Palete',
  faixa: 'Faixa',
};

const COLUNAS_NUMERICAS = new Set<OrdemImpressaoItem>([
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
]);

export type ItemGrupoMapaOrdemImpressao = {
  sku: string;
  descricao: string | null;
  lote: string | null;
  faixa: string | null;
  dataFabricacao: string | null;
  endereco?: string | null;
  quantidadeNormalizadaUnidades: number;
  breakdown: {
    paletes: number;
    caixas: number;
    unidades: number;
  } | null;
};

const CAMPO_VAZIO = '—';

function formatarDataPtBr(iso: string | null | undefined): string {
  if (!iso) {
    return CAMPO_VAZIO;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function colunaOrdemAlinhamento(
  item: OrdemImpressaoItem,
): 'left' | 'right' {
  return COLUNAS_NUMERICAS.has(item) ? 'right' : 'left';
}

export function resolverValorColunaOrdemImpressao(
  item: ItemGrupoMapaOrdemImpressao,
  coluna: OrdemImpressaoItem,
): string {
  switch (coluna) {
    case 'sku':
      return item.sku;
    case 'descricao':
      return item.descricao?.trim() ? item.descricao : CAMPO_VAZIO;
    case 'lote':
      return item.lote ?? CAMPO_VAZIO;
    case 'faixa':
      return item.faixa ?? CAMPO_VAZIO;
    case 'quantidade_unidade':
      return String(item.breakdown?.unidades ?? item.quantidadeNormalizadaUnidades);
    case 'quantidade_caixa':
      return String(item.breakdown?.caixas ?? 0);
    case 'quantidade_palete':
      return String(item.breakdown?.paletes ?? 0);
    case 'data_minima':
      return formatarDataPtBr(item.dataFabricacao);
    case 'endereco':
      return item.endereco?.trim() ? item.endereco : CAMPO_VAZIO;
    case 'data_maxima':
    default:
      return CAMPO_VAZIO;
  }
}

export function montarHtmlTabelaItens(
  itens: ItemGrupoMapaOrdemImpressao[],
  ordemColunas: OrdemImpressaoItem[],
): string {
  if (ordemColunas.length === 0) {
    return '';
  }

  const headerCells = ordemColunas
    .map((coluna) => {
      const align = colunaOrdemAlinhamento(coluna);
      return `<th style="text-align:${align};padding:3px 4px;border:1px solid #ccc;background:#f4f4f4;font-size:9px;text-transform:uppercase;">${ORDEM_IMPRESSAO_LABELS[coluna]}</th>`;
    })
    .join('');

  const bodyRows = itens
    .map((item) => {
      const cells = ordemColunas
        .map((coluna) => {
          const align = colunaOrdemAlinhamento(coluna);
          const valor = resolverValorColunaOrdemImpressao(item, coluna);
          const fontMono = coluna === 'sku' ? 'font-family:monospace;' : '';
          return `<td style="text-align:${align};padding:3px 4px;border:1px solid #ccc;${fontMono}">${escapeHtml(valor)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:10px;color:#222;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
