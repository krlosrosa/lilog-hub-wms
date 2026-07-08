import * as XLSX from 'xlsx';

import { downloadBlobArquivo } from '@/lib/api';

const TEMPLATE_HEADERS = [
  'zona',
  'rua',
  'posicao',
  'nivel',
  'tipo',
  'tipo_estrutura',
  'largura_mm',
  'altura_mm',
  'profundidade_mm',
  'carga_max_kg',
  'capacidade_volume',
  'prioridade_picking',
  'curva_abc',
  'vinculo_sku_fixo',
  'regra_lote_unico',
  'permite_mistura_validade',
  'permite_fracionado',
  'observacao',
] as const;

const EXAMPLE_PICKING_ROW = [
  'A',
  '1',
  '1',
  '10',
  'picking',
  'porta-palete',
  1200,
  1500,
  1000,
  1000,
  '',
  1,
  'A',
  'NAO',
  'NAO',
  'NAO',
  'NAO',
  'Exemplo de endereço estruturado',
];

const EXAMPLE_OPERACIONAL_ROW = [
  'REC',
  '',
  '',
  '',
  'recebimento',
  'piso',
  5000,
  3000,
  8000,
  5000,
  '',
  '',
  'B',
  'NAO',
  'NAO',
  'SIM',
  'NAO',
  'Exemplo de área operacional',
];

const ORIENTACOES: Array<[string, string]> = [
  [
    'Centro',
    'Não é necessário informar na planilha. Os endereços serão cadastrados no centro padrão da unidade selecionada no sistema.',
  ],
  ['zona', 'Obrigatório. Identificador da zona (até 10 caracteres).'],
  [
    'rua',
    'Obrigatório para picking/pulmão. Letras, números ou hífen. Será normalizada com 3 dígitos (zeros à esquerda).',
  ],
  [
    'posicao',
    'Obrigatório para picking/pulmão. Letras, números ou hífen. Será normalizada com 4 dígitos (zeros à esquerda).',
  ],
  [
    'nivel',
    'Obrigatório para picking/pulmão. Letras, números ou hífen. Será normalizada com zeros à esquerda.',
  ],
  [
    'tipo',
    'Obrigatório. Valores aceitos: picking, pulmao, aereo, recebimento, expedicao, avaria, inventario, cross_docking, area_operacional.',
  ],
  [
    'tipo_estrutura',
    'Obrigatório. Para picking/pulmão/aéreo use: porta-palete, drive-in, estante-dinamica, flow-rack. Para demais tipos use: piso, staging, area-delimitada, patio.',
  ],
  ['largura_mm', 'Obrigatório. Número inteiro positivo em milímetros.'],
  ['altura_mm', 'Obrigatório. Número inteiro positivo em milímetros.'],
  ['profundidade_mm', 'Obrigatório. Número inteiro positivo em milímetros.'],
  ['carga_max_kg', 'Obrigatório. Número positivo em quilogramas.'],
  ['capacidade_volume', 'Opcional. Número positivo.'],
  ['prioridade_picking', 'Opcional. Número inteiro.'],
  ['curva_abc', 'Opcional. Valores aceitos: A, B ou C. Padrão: B.'],
  ['vinculo_sku_fixo', 'Opcional. SIM ou NAO. Padrão: NAO.'],
  ['regra_lote_unico', 'Opcional. SIM ou NAO. Padrão: NAO.'],
  ['permite_mistura_validade', 'Opcional. SIM ou NAO. Padrão: NAO.'],
  ['permite_fracionado', 'Opcional. SIM ou NAO. Padrão: NAO.'],
  ['observacao', 'Opcional. Texto livre.'],
  [
    'Código gerado',
    'O sistema monta automaticamente o código mascarado: ZONA RUA POSICAO NIVEL (ex: A 001 0001 10). Para tipos operacionais sem rua/posição/nível, usa apenas a zona.',
  ],
  [
    'Unicidade',
    'Cada código gerado deve ser único no centro da unidade selecionada. Linhas duplicadas serão rejeitadas.',
  ],
];

export function downloadEnderecoTemplate(): void {
  const dadosSheet = XLSX.utils.aoa_to_sheet([
    [...TEMPLATE_HEADERS],
    EXAMPLE_PICKING_ROW,
    EXAMPLE_OPERACIONAL_ROW,
  ]);

  const orientacoesSheet = XLSX.utils.aoa_to_sheet([
    ['Campo', 'Descrição'],
    ...ORIENTACOES,
  ]);

  dadosSheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  orientacoesSheet['!cols'] = [{ wch: 28 }, { wch: 90 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dadosSheet, 'Dados');
  XLSX.utils.book_append_sheet(workbook, orientacoesSheet, 'Orientações');

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlobArquivo(
    blob,
    `modelo-importacao-enderecos-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
