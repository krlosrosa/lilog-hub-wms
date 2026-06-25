import type { LinhaSeparacao } from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

const COLUNAS_ESPERADAS = [
  'transporte',
  'remessa',
  'cliente',
  'nomecliente',
  'sku',
  'descricao',
  'quantidade',
] as const;

function normalizarHeader(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '');
}

function parseQuantidade(valor: string): number {
  const n = Number.parseInt(valor.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parsearCsvSeparacao(conteudo: string): LinhaSeparacao[] {
  const linhasTexto = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhasTexto.length === 0) {
    return [];
  }

  const separador = linhasTexto[0]?.includes(';') ? ';' : ',';
  const primeira = linhasTexto[0]!.split(separador).map((c) => c.trim());
  const headers = primeira.map(normalizarHeader);
  const temHeader = COLUNAS_ESPERADAS.every((col) => headers.includes(col));
  const dados = temHeader ? linhasTexto.slice(1) : linhasTexto;

  const indice = (nome: string) => headers.indexOf(nome);

  return dados.map((linha, index) => {
    const cols = linha.split(separador).map((c) => c.trim());

    if (temHeader) {
      return {
        id: `lin-import-${Date.now()}-${index}`,
        transporte: cols[indice('transporte')] ?? 'TR-000',
        remessa: cols[indice('remessa')] ?? 'RM-00000',
        cliente: cols[indice('cliente')] ?? 'CLI-0000',
        nomeCliente: cols[indice('nomecliente')] ?? 'Cliente Importado',
        sku: cols[indice('sku')] ?? `SKU-IMP-${index + 1}`,
        descricao: cols[indice('descricao')] ?? 'Queijo Variável — Importado',
        quantidade: parseQuantidade(cols[indice('quantidade')] ?? '1'),
        status: 'pendente' as const,
      };
    }

    return {
      id: `lin-import-${Date.now()}-${index}`,
      transporte: cols[0] ?? 'TR-000',
      remessa: cols[1] ?? 'RM-00000',
      cliente: cols[2] ?? 'CLI-0000',
      nomeCliente: cols[3] ?? 'Cliente Importado',
      sku: cols[4] ?? `SKU-IMP-${index + 1}`,
      descricao: cols[5] ?? 'Queijo Variável — Importado',
      quantidade: parseQuantidade(cols[6] ?? '1'),
      status: 'pendente' as const,
    };
  });
}

export function criarLinhasMockDoArquivo(nomeArquivo: string): LinhaSeparacao[] {
  const base = nomeArquivo.replace(/\.[^.]+$/, '').slice(0, 12);

  return [
    {
      id: `lin-import-${Date.now()}-0`,
      transporte: 'TR-UP',
      remessa: `RM-${base.toUpperCase()}`,
      cliente: 'CLI-IMPORT',
      nomeCliente: 'Cliente via Upload',
      sku: 'QJ-UP-001',
      descricao: `Importado de ${nomeArquivo}`,
      quantidade: 4,
      status: 'pendente',
    },
    {
      id: `lin-import-${Date.now()}-1`,
      transporte: 'TR-UP',
      remessa: `RM-${base.toUpperCase()}`,
      cliente: 'CLI-IMPORT',
      nomeCliente: 'Cliente via Upload',
      sku: 'QJ-UP-002',
      descricao: `Importado de ${nomeArquivo}`,
      quantidade: 6,
      status: 'pendente',
    },
  ];
}
