import { Inject, Injectable } from '@nestjs/common';

import { buildPreRecebimentoDocumentoRef } from '../../../domain/model/estoque/deposito.model.js';
import {
  groupSaldoBucketsByRastreio,
  type SaldoRastreioBucket,
} from '../../../domain/services/estoque-recebimento-buckets.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ItemPreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  buildUnidadesPorCaixaMap,
  toBaseUnits,
} from '../../../domain/services/unidade-medida.js';
import { MovimentarEstoqueUseCase } from './movimentar-estoque.usecase.js';

export type ReconciliarSaldoRecebimentoInput = {
  unidadeId: string;
  preRecebimentoId: string;
  itensEsperados: ItemPreRecebimentoRecord[];
  itensConferidos: ItemRecebimentoRecord[];
  operatorId: number | null;
};

function aggregateConferidosPorRastreio(
  itens: ItemRecebimentoRecord[],
  unidadesPorCaixaMap: Map<string, number>,
): Map<string, SaldoRastreioBucket> {
  const buckets: SaldoRastreioBucket[] = [];

  for (const item of itens) {
    const unidadesPorCaixa = unidadesPorCaixaMap.get(item.produtoId) ?? 1;
    const quantidadeUN = toBaseUnits(
      item.quantidadeRecebida,
      item.unidadeMedida,
      unidadesPorCaixa,
    );

    if (quantidadeUN <= 0) {
      continue;
    }

    buckets.push({
      produtoId: item.produtoId,
      lote: item.loteRecebido?.trim() ?? '',
      numeroSerie: item.numeroSerie?.trim() ?? '',
      validade: item.validade,
      quantidade: quantidadeUN,
      unidadeMedida: 'UN',
    });
  }

  return groupSaldoBucketsByRastreio(buckets);
}

@Injectable()
export class ReconciliarSaldoRecebimentoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    private readonly movimentarEstoqueUseCase: MovimentarEstoqueUseCase,
  ) {}

  async execute(input: ReconciliarSaldoRecebimentoInput) {
    const deposito = await this.estoqueRepository.findDepositoByCodigo(
      input.unidadeId,
      'TRANSF',
    );

    if (!deposito) {
      throw new Error('Depósito TRANSF não encontrado');
    }

    const documentoRef = buildPreRecebimentoDocumentoRef(
      input.preRecebimentoId,
    );
    const unidadesPorCaixaMap = buildUnidadesPorCaixaMap(input.itensEsperados);
    const netsTransf =
      await this.estoqueRepository.getNetSaldoTransfPorDocumento(
        input.unidadeId,
        deposito.id,
        documentoRef,
      );

    const conferidosPorRastreio = aggregateConferidosPorRastreio(
      input.itensConferidos,
      unidadesPorCaixaMap,
    );
    const transfPorRastreio = groupSaldoBucketsByRastreio(
      netsTransf.map((bucket) => ({
        produtoId: bucket.produtoId,
        lote: bucket.lote,
        numeroSerie: bucket.numeroSerie,
        validade: bucket.validade,
        quantidade: bucket.quantidade,
        unidadeMedida: bucket.unidadeMedida,
      })),
    );

    const rastreioKeys = new Set([
      ...conferidosPorRastreio.keys(),
      ...transfPorRastreio.keys(),
    ]);

    for (const key of rastreioKeys) {
      const conferido = conferidosPorRastreio.get(key);
      const transf = transfPorRastreio.get(key);
      const alvo = conferido?.quantidade ?? 0;
      const atual = transf?.quantidade ?? 0;
      const delta = alvo - atual;

      if (delta === 0) {
        continue;
      }

      const bucket = conferido ?? transf;

      if (!bucket) {
        continue;
      }

      await this.movimentarEstoqueUseCase.ajustarSaldo({
        unidadeId: input.unidadeId,
        depositoId: deposito.id,
        produtoId: bucket.produtoId,
        delta,
        unidadeMedida: bucket.unidadeMedida,
        documentoRef,
        motivo: 'recebimento_reconciliacao',
        operatorId: input.operatorId,
        lote: bucket.lote || undefined,
        validade: bucket.validade,
        numeroSerie: bucket.numeroSerie || undefined,
      });
    }
  }
}
