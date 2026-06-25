import type {
  EtiquetaSeparacao,
  LinhaSeparacao,
} from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

export function expandirLinhasParaEtiquetas(
  linhas: LinhaSeparacao[],
): EtiquetaSeparacao[] {
  return linhas.flatMap((linha) =>
    Array.from({ length: linha.quantidade }, (_, i) => ({
      ...linha,
      numeroCaixa: i + 1,
      totalCaixas: linha.quantidade,
      codigo: `ETQ-${linha.remessa}-${linha.sku}-CX${String(i + 1).padStart(2, '0')}`,
    })),
  );
}

export function totalEtiquetasDasLinhas(linhas: LinhaSeparacao[]): number {
  return linhas.reduce((acc, linha) => acc + linha.quantidade, 0);
}
