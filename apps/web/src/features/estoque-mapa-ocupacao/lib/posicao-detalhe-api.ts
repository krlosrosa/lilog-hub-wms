import { getEndereco } from '@/features/enderecos/lib/endereco-api';
import type { EnderecoApi } from '@/features/enderecos/types/endereco.api';
import { listSaldosEndereco } from '@/features/estoque/lib/estoque-api';
import type { SaldoEnderecoComProdutoApi } from '@/features/estoque/types/estoque.api';

export type PosicaoDetalheData = {
  endereco: EnderecoApi;
  saldos: SaldoEnderecoComProdutoApi[];
  totalSaldos: number;
};

export async function fetchPosicaoDetalhe(
  unidadeId: string,
  enderecoId: string,
): Promise<PosicaoDetalheData> {
  const [endereco, saldosResponse] = await Promise.all([
    getEndereco(enderecoId),
    listSaldosEndereco({
      unidadeId,
      enderecoId,
    }),
  ]);

  return {
    endereco,
    saldos: saldosResponse.items,
    totalSaldos: saldosResponse.items.length,
  };
}
