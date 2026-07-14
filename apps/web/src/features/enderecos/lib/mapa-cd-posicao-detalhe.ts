import { listSaldosEndereco } from '@/features/estoque/lib/estoque-api';
import type { SaldoEnderecoComProdutoApi } from '@/features/estoque/types/estoque.api';

import type { MapaCdNivel } from '@/features/enderecos/types/mapa-cd.schema';

export type MapaCdPosicaoDetalhe = {
  saldosPorNivel: Record<string, SaldoEnderecoComProdutoApi[]>;
  totalSaldos: number;
};

export async function fetchMapaCdPosicaoDetalhe(
  unidadeId: string,
  niveis: MapaCdNivel[],
): Promise<MapaCdPosicaoDetalhe> {
  const enderecoIds = niveis.map((nivel) => nivel.id);

  if (enderecoIds.length === 0) {
    return { saldosPorNivel: {}, totalSaldos: 0 };
  }

  const response = await listSaldosEndereco({
    unidadeId,
    enderecoIds,
  });

  const saldosPorNivel: Record<string, SaldoEnderecoComProdutoApi[]> = {};

  for (const nivel of niveis) {
    saldosPorNivel[nivel.id] = [];
  }

  for (const saldo of response.items) {
    const bucket = saldosPorNivel[saldo.enderecoId] ?? [];
    bucket.push(saldo);
    saldosPorNivel[saldo.enderecoId] = bucket;
  }

  return {
    saldosPorNivel,
    totalSaldos: response.items.length,
  };
}
