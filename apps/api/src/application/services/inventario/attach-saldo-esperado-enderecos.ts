import type { SaldoEnderecoComProduto } from '../../../domain/repositories/estoque/estoque.repository.js';
import type {
  DemandaEnderecoRecord,
  SaldoEsperadoEnderecoItem,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { IEstoqueRepository } from '../../../domain/repositories/estoque/estoque.repository.js';

export function mapSaldoToEsperadoItem(
  saldo: SaldoEnderecoComProduto,
): SaldoEsperadoEnderecoItem {
  return {
    saldoEnderecoId: saldo.id,
    produtoId: saldo.produtoId,
    sku: saldo.produtoSku,
    nome: saldo.produtoNome,
    lote: saldo.lote,
    quantidade: saldo.quantidade,
    unidadeMedida: saldo.unidadeMedida,
    numeroSerie: saldo.numeroSerie,
    unidadesPorCaixa: saldo.unidadesPorCaixa,
  };
}

export async function attachSaldoEsperadoToEnderecos(
  estoqueRepository: IEstoqueRepository,
  enderecos: DemandaEnderecoRecord[],
): Promise<DemandaEnderecoRecord[]> {
  if (enderecos.length === 0) {
    return enderecos;
  }

  const unidadeId = enderecos[0]!.unidadeId;
  const enderecoIds = enderecos.map((item) => item.enderecoId);

  const saldos = await estoqueRepository.listSaldosEndereco({
    unidadeId,
    enderecoIds,
    natureza: 'fisico',
  });

  const saldosPorEndereco = new Map<string, SaldoEsperadoEnderecoItem[]>();

  for (const saldo of saldos) {
    const current = saldosPorEndereco.get(saldo.enderecoId) ?? [];
    current.push(mapSaldoToEsperadoItem(saldo));
    saldosPorEndereco.set(saldo.enderecoId, current);
  }

  return enderecos.map((item) => ({
    ...item,
    saldoEsperado: saldosPorEndereco.get(item.enderecoId) ?? [],
  }));
}

export function resolveSaldoEsperadoLinha(
  saldos: SaldoEsperadoEnderecoItem[],
  options?: {
    lote?: string | null;
    saldoEnderecoId?: string | null;
    produtoId?: string | null;
  },
): SaldoEsperadoEnderecoItem | null {
  if (saldos.length === 0) {
    return null;
  }

  if (options?.saldoEnderecoId) {
    const byId = saldos.find(
      (item) => item.saldoEnderecoId === options.saldoEnderecoId,
    );
    if (byId) {
      return byId;
    }
  }

  if (options?.produtoId) {
    const byProduto = saldos.find(
      (item) => item.produtoId === options.produtoId,
    );
    if (byProduto) {
      return byProduto;
    }
  }

  const lote = options?.lote?.trim();
  if (lote) {
    const byLote = saldos.find((item) => item.lote.trim() === lote);
    if (byLote) {
      return byLote;
    }
  }

  if (saldos.length === 1) {
    return saldos[0] ?? null;
  }

  return saldos[0] ?? null;
}
