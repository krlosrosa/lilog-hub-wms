import type {
  DevolucaoConferenciaRascunhoEntry,
  DevolucaoItemApi,
  DevolucaoItemCondicaoApi,
  DemandaDetalheCache,
  LoteConferido,
  QuantidadeModo,
} from '@/features/devolucao/types/devolucao.schema';
import { db } from '@/lib/offline/db';

export function findDevolucaoItemInDetalhe(
  detalhe: DemandaDetalheCache | undefined,
  itemId: string,
): DevolucaoItemApi | undefined {
  if (!detalhe) {
    return undefined;
  }

  for (const nf of detalhe.notasFiscais) {
    const found = nf.itens.find((item) => item.id === itemId);
    if (found) {
      return found;
    }
  }

  return undefined;
}

export function buildLotesFromApiConferencia(
  apiItem: DevolucaoItemApi,
  quantidadeModo: QuantidadeModo,
): LoteConferido[] {
  if (apiItem.qtdConferida == null) {
    return [];
  }

  const qtd = apiItem.qtdConferida;
  const recebidaCaixa = quantidadeModo === 'unidade' ? 0 : qtd;
  const recebidaUnidade = quantidadeModo === 'caixa' ? 0 : qtd;

  return [
    {
      id: `lote-saved-${apiItem.id}`,
      lote: apiItem.lote ?? '',
      dataFabricacao: apiItem.dataFabricacao ?? '',
      idPalete: '',
      recebidaCaixa,
      recebidaUnidade,
      peso: apiItem.pesoDevolvido ?? undefined,
    },
  ];
}

export function sumLotesConferidos(lotes: LoteConferido[]) {
  return lotes.reduce(
    (acc, lote) => ({
      caixa: acc.caixa + lote.recebidaCaixa,
      unidade: acc.unidade + lote.recebidaUnidade,
    }),
    { caixa: 0, unidade: 0 },
  );
}

export function resolveConferidoTotaisForItem(input: {
  itemId?: string;
  qtdConferida?: number | null;
  rascunho?: DevolucaoConferenciaRascunhoEntry;
  detalhe?: DemandaDetalheCache;
  quantidadeModo: QuantidadeModo;
}): { caixa: number; unidade: number; hasConferencia: boolean } {
  if (input.rascunho?.lotes.length) {
    const totais = sumLotesConferidos(input.rascunho.lotes);
    return {
      ...totais,
      hasConferencia: totais.caixa > 0 || totais.unidade > 0,
    };
  }

  if (input.itemId && input.detalhe) {
    const apiItem = findDevolucaoItemInDetalhe(input.detalhe, input.itemId);
    if (apiItem?.qtdConferida != null) {
      const totais = sumLotesConferidos(
        buildLotesFromApiConferencia(apiItem, input.quantidadeModo),
      );
      return {
        ...totais,
        hasConferencia: totais.caixa > 0 || totais.unidade > 0,
      };
    }
  }

  if (input.qtdConferida != null) {
    const qtd = input.qtdConferida;
    return {
      caixa: input.quantidadeModo === 'unidade' ? 0 : qtd,
      unidade: input.quantidadeModo === 'caixa' ? 0 : qtd,
      hasConferencia: qtd > 0,
    };
  }

  return { caixa: 0, unidade: 0, hasConferencia: false };
}

export async function getConferenciaRascunho(
  demandId: string,
  itemId: string,
): Promise<DevolucaoConferenciaRascunhoEntry | undefined> {
  return db.devolucaoConferenciaRascunho.get([demandId, itemId]);
}

export async function listConferenciaRascunhos(
  demandId: string,
): Promise<DevolucaoConferenciaRascunhoEntry[]> {
  return db.devolucaoConferenciaRascunho.where('demandId').equals(demandId).toArray();
}

export async function saveConferenciaRascunho(input: {
  demandId: string;
  itemId: string;
  sku: string;
  lotes: LoteConferido[];
  qtdConferidaTotal: number;
  condicao?: DevolucaoItemCondicaoApi;
}): Promise<void> {
  await db.devolucaoConferenciaRascunho.put({
    demandId: input.demandId,
    itemId: input.itemId,
    sku: input.sku,
    lotes: input.lotes,
    qtdConferidaTotal: input.qtdConferidaTotal,
    condicao: input.condicao,
    updatedAt: Date.now(),
  });
}

export async function buildRascunhosMap(demandId: string) {
  const rascunhos = await listConferenciaRascunhos(demandId);
  return new Map(
    rascunhos.map((entry) => [
      entry.itemId,
      {
        qtdConferidaTotal: entry.qtdConferidaTotal,
        condicao: entry.condicao,
      },
    ]),
  );
}
