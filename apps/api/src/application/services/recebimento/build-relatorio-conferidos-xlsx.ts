import * as XLSX from 'xlsx';

export type RelatorioConferidosXlsxRow = {
  sku: string;
  descricao: string;
  loteConferido: string;
  quantidadeCaixa: number;
  pesoKg: number;
  conferenteId: string;
  conferenteNome: string;
  numeroTransporte: string;
};

const HEADERS = [
  'SKU',
  'Descrição',
  'Lote Conferido',
  'Qtd Caixa',
  'Peso (Kg)',
  'ID Conferente',
  'Nome Conferente',
  'Nº Transporte',
] as const;

export function buildRelatorioConferidosXlsx(
  rows: RelatorioConferidosXlsxRow[],
): Buffer {
  const data = [
    [...HEADERS],
    ...rows.map((row) => [
      row.sku,
      row.descricao,
      row.loteConferido,
      row.quantidadeCaixa,
      row.pesoKg,
      row.conferenteId,
      row.conferenteNome,
      row.numeroTransporte,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 40 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conferidos');

  return Buffer.from(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  );
}
