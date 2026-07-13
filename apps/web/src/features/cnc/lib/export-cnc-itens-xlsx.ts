import * as XLSX from 'xlsx';

import { downloadBlobArquivo } from '@/lib/api';

import {
  formatFabricacaoFromItem,
  formatUnidadeMedidaItem,
  resolverLoteItem,
} from '@/features/cnc/lib/cnc-item-display-utils';
import type { CncItemListado } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ITEM_TIPO_LABELS,
  CNC_SITUACAO_LABELS,
  CNC_SUBTIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';

const HEADERS = [
  'CNC',
  'Status',
  'SKU',
  'Produto',
  'Lote',
  'Fabricação',
  'Tipo',
  'Ocorrência',
  'Unidade',
  'Qtd Divergente',
  'Data',
] as const;

const COLUMN_WIDTHS = [
  { wch: 14 },
  { wch: 14 },
  { wch: 14 },
  { wch: 38 },
  { wch: 16 },
  { wch: 12 },
  { wch: 14 },
  { wch: 24 },
  { wch: 10 },
  { wch: 14 },
  { wch: 12 },
] as const;

const QTD_COL_LETTER = 'J';
const DATA_COL_LETTER = 'K';

type ExportCncItensXlsxOptions = {
  filtros?: {
    dataInicio: string;
    dataFim: string;
  };
  filenamePrefix?: string;
};

function formatDateBrFromIsoDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function buildMetadataRows(
  filtros?: ExportCncItensXlsxOptions['filtros'],
): (string | null)[][] {
  const rows: (string | null)[][] = [
    ['Itens de Não Conformidade (CNC)'],
    [`Exportado em: ${new Date().toLocaleString('pt-BR')}`],
  ];

  if (filtros) {
    rows.push([
      `Período: ${formatDateBrFromIsoDate(filtros.dataInicio)} a ${formatDateBrFromIsoDate(filtros.dataFim)}`,
    ]);
  }

  rows.push([null]);
  return rows;
}

function buildDataRows(items: CncItemListado[]) {
  return items.map((item) => {
    const fabricacao = formatFabricacaoFromItem(item);
    const unidadeMedida = formatUnidadeMedidaItem(item);

    return [
      item.cncNumero,
      CNC_SITUACAO_LABELS[item.cncSituacao],
      item.sku ?? '',
      item.descricaoProduto ?? '',
      resolverLoteItem(item) ?? '',
      fabricacao === '—' ? '' : fabricacao,
      CNC_ITEM_TIPO_LABELS[item.tipo],
      item.subtipoOcorrencia ? CNC_SUBTIPO_LABELS[item.subtipoOcorrencia] : '',
      unidadeMedida === '—' ? '' : unidadeMedida,
      item.quantidadeDivergente,
      item.createdAt ? new Date(item.createdAt) : null,
    ];
  });
}

function applyCellFormats(
  worksheet: XLSX.WorkSheet,
  headerRow: number,
  dataRowCount: number,
) {
  for (let row = headerRow + 1; row <= headerRow + dataRowCount; row += 1) {
    const qtdCell = worksheet[`${QTD_COL_LETTER}${row}`];
    if (qtdCell && typeof qtdCell.v === 'number') {
      qtdCell.z = '#,##0.000';
    }

    const dateCell = worksheet[`${DATA_COL_LETTER}${row}`];
    if (dateCell?.t === 'd') {
      dateCell.z = 'dd/mm/yyyy';
    }
  }
}

export function exportCncItensXlsx(
  items: CncItemListado[],
  options?: ExportCncItensXlsxOptions,
) {
  const metadataRows = buildMetadataRows(options?.filtros);
  const headerRow = metadataRows.length + 1;
  const dataRows = buildDataRows(items);

  const worksheet = XLSX.utils.aoa_to_sheet(
    [...metadataRows, [...HEADERS], ...dataRows],
    { cellDates: true },
  );

  worksheet['!cols'] = [...COLUMN_WIDTHS];

  const lastRow = headerRow + dataRows.length;
  const lastCol = XLSX.utils.encode_col(HEADERS.length - 1);

  worksheet['!autofilter'] = {
    ref: `A${headerRow}:${lastCol}${lastRow}`,
  };

  worksheet['!freeze'] = {
    xSplit: 0,
    ySplit: headerRow,
    topLeftCell: `A${headerRow + 1}`,
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  applyCellFormats(worksheet, headerRow, dataRows.length);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itens CNC');

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellDates: true,
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filenamePrefix = options?.filenamePrefix ?? 'cnc-itens';

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlobArquivo(blob, `${filenamePrefix}-${dateStamp}.xlsx`);
}
