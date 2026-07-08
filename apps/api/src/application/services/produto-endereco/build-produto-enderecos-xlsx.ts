import * as XLSX from 'xlsx';

import type { ProdutoEnderecoPapel } from '../../../domain/model/produto-endereco/produto-endereco.model.js';

export type ProdutoEnderecoExportRow = {
  centroId: string;
  enderecoMascarado: string;
  sku: string;
  produtoId: string;
  papel: ProdutoEnderecoPapel | '';
  ordem: number | '';
  ativo: boolean | '';
};

const HEADERS = [
  'Centro ID',
  'Endereço',
  'SKU',
  'Produto ID',
  'Papel',
  'Ordem',
  'Ativo',
] as const;

function formatAtivo(value: boolean | ''): string {
  if (value === '') return '';
  return value ? 'SIM' : 'NÃO';
}

export function buildProdutoEnderecosXlsx(rows: ProdutoEnderecoExportRow[]): Buffer {
  const data = [
    [...HEADERS],
    ...rows.map((row) => [
      row.centroId,
      row.enderecoMascarado,
      row.sku,
      row.produtoId,
      row.papel,
      row.ordem === '' ? '' : row.ordem,
      formatAtivo(row.ativo),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 38 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ProdutoEnderecos');

  return Buffer.from(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  );
}
