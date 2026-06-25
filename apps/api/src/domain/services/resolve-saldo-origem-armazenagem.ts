import type { Saldo } from '../model/estoque/saldo.model.js';

function normalizeLote(lote?: string | null): string {
  return lote?.trim() ?? '';
}

function normalizeNumeroSerie(numeroSerie?: string | null): string {
  return numeroSerie?.trim() ?? '';
}

function normalizeDocumentoRef(documentoRef?: string | null): string {
  return documentoRef?.trim() ?? '';
}

export type SaldoOrigemArmazenagem = {
  documentoRef: string;
  quantidadeDisponivel: number;
};

export function resolveSaldoOrigemArmazenagem(
  saldos: Saldo[],
  input: {
    lote: string | null;
    numeroSerie: string | null;
    documentoRefsPrioridade: string[];
  },
): SaldoOrigemArmazenagem | null {
  const lote = normalizeLote(input.lote);
  const numeroSerie = normalizeNumeroSerie(input.numeroSerie);

  const matching = saldos.filter(
    (saldo) =>
      saldo.natureza === 'fisico' &&
      normalizeLote(saldo.lote) === lote &&
      normalizeNumeroSerie(saldo.numeroSerie) === numeroSerie &&
      saldo.quantidade > 0,
  );

  if (matching.length === 0) {
    return null;
  }

  const refs = [
    ...input.documentoRefsPrioridade.map(normalizeDocumentoRef),
    ...matching.map((saldo) => normalizeDocumentoRef(saldo.documentoRef)),
  ];

  const uniqueRefs = [...new Set(refs)];

  for (const documentoRef of uniqueRefs) {
    const saldo = matching.find(
      (entry) => normalizeDocumentoRef(entry.documentoRef) === documentoRef,
    );

    if (saldo) {
      return {
        documentoRef,
        quantidadeDisponivel: saldo.quantidade,
      };
    }
  }

  const best = [...matching].sort((a, b) => b.quantidade - a.quantidade)[0];

  if (!best) {
    return null;
  }

  return {
    documentoRef: normalizeDocumentoRef(best.documentoRef),
    quantidadeDisponivel: best.quantidade,
  };
}
