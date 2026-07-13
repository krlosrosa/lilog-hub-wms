import * as XLSX from 'xlsx';

export type MovimentacaoXlsxRow = {
  codigo: string;
  utilizacaoLivre: number;
  unidadeMedidaBasica: 'CX' | 'KG';
  depositoOrigem: string;
  loteOrigem: string;
  movimentacao: number;
  depositoDestino: string;
  loteDestino: string;
  centro: string;
};

const HEADERS = [
  'CÓDIGO',
  'Utilização livre',
  'Unid.medida básica',
  'Depósito',
  'LOTE',
  'Movimentação',
  'Depósito',
  'LOTE',
  'Centro',
] as const;

const DEPOSITO_ORIGEM = 'pati';
const DEPOSITO_DESTINO = 'gerl';
const TIPO_MOVIMENTACAO = 311;

export function buildMovimentacaoXlsx(rows: MovimentacaoXlsxRow[]): Buffer {
  const data = [
    [...HEADERS],
    ...rows.map((row) => [
      row.codigo,
      row.utilizacaoLivre,
      row.unidadeMedidaBasica,
      row.depositoOrigem,
      row.loteOrigem,
      row.movimentacao,
      row.depositoDestino,
      row.loteDestino,
      row.centro,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 8 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha1');

  return Buffer.from(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  );
}

export function createMovimentacaoXlsxRow(
  input: Omit<MovimentacaoXlsxRow, 'depositoOrigem' | 'movimentacao' | 'depositoDestino'>,
): MovimentacaoXlsxRow {
  return {
    ...input,
    depositoOrigem: DEPOSITO_ORIGEM,
    movimentacao: TIPO_MOVIMENTACAO,
    depositoDestino: DEPOSITO_DESTINO,
  };
}
