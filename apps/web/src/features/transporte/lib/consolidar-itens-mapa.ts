type ItemMapaConsolidavel = {
  sku: string;
  descricao?: string | null;
  lote: string | null;
  peso: number | null;
  quantidade?: number;
  quantidadeNormalizadaUnidades: number;
  unidadesPorCaixa?: number | null;
  caixasPorPalete?: number | null;
  pesoBrutoUnidade?: string | null;
  pesoBrutoCaixa?: string | null;
  pesoBrutoPalete?: string | null;
  pesoLiquidoUnidade?: string | null;
  pesoLiquidoCaixa?: string | null;
  pesoLiquidoPalete?: string | null;
};

export function consolidarItensPorSkuLote<T extends ItemMapaConsolidavel>(
  itens: T[],
): T[] {
  const porChave = new Map<string, T>();

  itens.forEach((item) => {
    const chave = `${item.sku}::${item.lote ?? ''}`;
    const atual = porChave.get(chave);

    if (!atual) {
      porChave.set(chave, { ...item });
      return;
    }

    porChave.set(chave, {
      ...atual,
      peso: (atual.peso ?? 0) + (item.peso ?? 0),
      quantidadeNormalizadaUnidades:
        atual.quantidadeNormalizadaUnidades + item.quantidadeNormalizadaUnidades,
      unidadesPorCaixa: atual.unidadesPorCaixa ?? item.unidadesPorCaixa ?? null,
      caixasPorPalete: atual.caixasPorPalete ?? item.caixasPorPalete ?? null,
      pesoBrutoUnidade: atual.pesoBrutoUnidade ?? item.pesoBrutoUnidade ?? null,
      pesoBrutoCaixa: atual.pesoBrutoCaixa ?? item.pesoBrutoCaixa ?? null,
      pesoBrutoPalete: atual.pesoBrutoPalete ?? item.pesoBrutoPalete ?? null,
      pesoLiquidoUnidade: atual.pesoLiquidoUnidade ?? item.pesoLiquidoUnidade ?? null,
      pesoLiquidoCaixa: atual.pesoLiquidoCaixa ?? item.pesoLiquidoCaixa ?? null,
      pesoLiquidoPalete: atual.pesoLiquidoPalete ?? item.pesoLiquidoPalete ?? null,
      descricao: atual.descricao ?? item.descricao ?? null,
    });
  });

  return Array.from(porChave.values());
}
