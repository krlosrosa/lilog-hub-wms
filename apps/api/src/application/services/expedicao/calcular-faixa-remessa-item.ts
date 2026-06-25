import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';

export const FAIXAS_REMESSA = [
  'vermelho',
  'laranja',
  'amarelo',
  'verde',
] as const;

export type FaixaRemessaItem = (typeof FAIXAS_REMESSA)[number];

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Data inválida: ${value}`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function diffDaysUtc(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function calcularPercentualVidaUtilRestante(
  dataFabricacao: string,
  dataReferencia: string,
  shelfLife: number,
): number {
  const fabricacao = parseDateOnly(dataFabricacao);
  const referencia = parseDateOnly(dataReferencia);
  const diasDecorridos = diffDaysUtc(fabricacao, referencia);
  const diasRestantes = shelfLife - diasDecorridos;

  return (diasRestantes / shelfLife) * 100;
}

export function classificarFaixaRemessaItem(
  percentualVidaUtilRestante: number,
): FaixaRemessaItem {
  if (percentualVidaUtilRestante <= 17.99) {
    return 'vermelho';
  }

  if (percentualVidaUtilRestante <= 32.99) {
    return 'laranja';
  }

  if (percentualVidaUtilRestante <= 49.99) {
    return 'amarelo';
  }

  return 'verde';
}

export function calcularFaixaRemessaItem(
  dataFabricacao: string | null,
  dataReferencia: string,
  produto: ProdutoRecord | null,
): FaixaRemessaItem | null {
  if (!dataFabricacao || !produto?.shelfLife) {
    return null;
  }

  const percentual = calcularPercentualVidaUtilRestante(
    dataFabricacao,
    dataReferencia,
    produto.shelfLife,
  );

  return classificarFaixaRemessaItem(percentual);
}
