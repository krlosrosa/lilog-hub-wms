import type { BuscarDemandaDevolucaoApiResponse } from '@/features/devolucao/lib/devolucao-api';
import {
  buildFaltasPesoAtivasPorItemId,
  resolveQtdEsperadaConferencia,
  shouldExcluirItemDaConferencia,
} from '@/features/devolucao/lib/resolve-item-contabil-devolucao';
import type {
  DemandaDetalheCache,
  DevolucaoFaltaPesoCache,
  DevolucaoNfApi,
  SkuItem,
} from '@/features/devolucao/types/devolucao.schema';
import { db } from '@/lib/offline/db';

export function mapDemandaDetalheToCache(
  response: BuscarDemandaDevolucaoApiResponse,
  faltasPeso: DevolucaoFaltaPesoCache[] = [],
): DemandaDetalheCache {
  return {
    id: response.id,
    codigoDemanda: response.codigoDemanda,
    status: response.status,
    unidadeId: response.unidadeId,
    observacao: response.observacao,
    placa: response.placa,
    cliente: response.cliente,
    transporteId: response.transporteId,
    tiposNf: response.tiposNf,
    totalNfs: response.totalNfs,
    totalItens: response.totalItens,
    pesoDevolvido: response.pesoDevolvido,
    notasFiscais: response.notasFiscais,
    faltasPeso,
    updatedAt: response.updatedAt,
    cachedAt: Date.now(),
  };
}

export async function cacheDemandaDetalhe(
  response: BuscarDemandaDevolucaoApiResponse,
  faltasPeso: DevolucaoFaltaPesoCache[] = [],
): Promise<DemandaDetalheCache> {
  const cache = mapDemandaDetalheToCache(response, faltasPeso);
  await db.devolucaoDemandasDetalhes.put(cache);
  return cache;
}

export async function getDemandaDetalhe(
  demandaId: string,
): Promise<DemandaDetalheCache | undefined> {
  return db.devolucaoDemandasDetalhes.get(demandaId);
}

export async function clearDemandaDetalhe(demandaId: string): Promise<void> {
  await db.devolucaoDemandasDetalhes.delete(demandaId);
  await db.devolucaoConferenciaRascunho.where('demandId').equals(demandaId).delete();
}

export function mapItensToSkuItems(
  notasFiscais: DevolucaoNfApi[],
  rascunhosPorItemId: Map<string, { qtdConferidaTotal: number; condicao?: string }> = new Map(),
  faltasPeso: DevolucaoFaltaPesoCache[] = [],
): SkuItem[] {
  const faltasPorItemId = buildFaltasPesoAtivasPorItemId(faltasPeso);

  return notasFiscais.flatMap((nf) =>
    nf.itens.flatMap((item) => {
      if (shouldExcluirItemDaConferencia(item.id, faltasPorItemId)) {
        return [];
      }

      const rascunho = rascunhosPorItemId.get(item.id);
      const qtdConferida = rascunho?.qtdConferidaTotal ?? item.qtdConferida;
      const condicao = (rascunho?.condicao ?? item.condicao) as SkuItem['condicao'];
      const qtdEsperada = resolveQtdEsperadaConferencia(
        item.quantidade,
        item.id,
        faltasPorItemId,
      );
      const conferido =
        qtdConferida !== null &&
        qtdConferida !== undefined &&
        qtdEsperada > 0 &&
        qtdConferida >= qtdEsperada;
      const hasDivergencia =
        qtdEsperada > 0 &&
        qtdConferida !== null &&
        qtdConferida !== undefined &&
        qtdConferida !== qtdEsperada;
      const hasAvaria = condicao === 'avariado';

      return [
        {
          sku: item.sku,
          name: item.descricaoProduto ?? item.sku,
          status: conferido ? 'conferido' : 'pendente',
          itemId: item.id,
          nfNumero: nf.numeroNf,
          qtdEsperada,
          qtdConferida,
          condicao,
          hasAvaria,
          hasDivergencia,
          isReentrega: nf.tipo === 'reentrega',
          quantidadeEsperada: qtdEsperada,
          pesoVariavel: item.pesoVariavel ?? false,
        } satisfies SkuItem,
      ];
    }),
  );
}
