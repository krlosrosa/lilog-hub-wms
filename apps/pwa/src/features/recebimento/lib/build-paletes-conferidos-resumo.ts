import type { ConferenciaConferidoDetalheApi } from '../types/recebimento.api';

export type PaleteConferidoResumo = {
  unitizadorCodigo: string;
  itens: Array<{
    sku: string;
    descricao: string;
    lote: string | null;
    quantidadeLabel: string;
  }>;
};

function formatQuantidade(
  quantidadeRecebida: number,
  unidadesPorCaixa: number,
): string {
  if (unidadesPorCaixa <= 1) {
    return `${quantidadeRecebida} un`;
  }

  const caixas = Math.floor(quantidadeRecebida / unidadesPorCaixa);
  const unidades = quantidadeRecebida % unidadesPorCaixa;
  const parts: string[] = [];

  if (caixas > 0) {
    parts.push(`${caixas} cx`);
  }

  if (unidades > 0) {
    parts.push(`${unidades} un`);
  }

  return parts.length > 0 ? parts.join(' · ') : `${quantidadeRecebida} un`;
}

export function buildPaletesConferidosResumo(
  conferidos: ConferenciaConferidoDetalheApi[] | undefined,
): PaleteConferidoResumo[] {
  if (!conferidos?.length) {
    return [];
  }

  const grupos = new Map<string, PaleteConferidoResumo>();

  for (const conferido of conferidos) {
    const unitizadorCodigo = conferido.unitizadorCodigo?.trim();
    if (!unitizadorCodigo) {
      continue;
    }

    const grupo =
      grupos.get(unitizadorCodigo) ??
      ({
        unitizadorCodigo,
        itens: [],
      } satisfies PaleteConferidoResumo);

    grupo.itens.push({
      sku: conferido.sku,
      descricao: conferido.descricao,
      lote: conferido.loteRecebido,
      quantidadeLabel: formatQuantidade(
        conferido.quantidadeRecebida,
        conferido.unidadesPorCaixa,
      ),
    });

    grupos.set(unitizadorCodigo, grupo);
  }

  return [...grupos.values()].sort((a, b) =>
    a.unitizadorCodigo.localeCompare(b.unitizadorCodigo),
  );
}

export function buildLotesDisponiveisPorProduto(
  conferidos: ConferenciaConferidoDetalheApi[] | undefined,
  produtoId: string,
): string[] {
  if (!conferidos?.length) {
    return [];
  }

  const lotes = new Set<string>();

  for (const conferido of conferidos) {
    if (conferido.produtoId !== produtoId) {
      continue;
    }

    const lote = conferido.loteRecebido?.trim();
    if (lote) {
      lotes.add(lote);
    }
  }

  return [...lotes.values()].sort((a, b) => a.localeCompare(b));
}
