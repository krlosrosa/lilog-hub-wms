import { Inject, Injectable } from '@nestjs/common';

import {
  buildPreRecebimentoDocumentoRef,
  type DepositoCodigo,
} from '../../../domain/model/estoque/deposito.model.js';
import type { TipoDivergencia } from '../../../domain/model/recebimento/recebimento.model.js';
import {
  drainSaldoTransfBuckets,
  groupSaldoTransfBucketsByProduto,
  sumSaldoTransfBuckets,
} from '../../../domain/services/estoque-recebimento-buckets.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ItemPreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type {
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { RecebimentoAvariaRecord } from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  calcularFaltaSemFisico,
  resolverDepositoDestinoFisico,
} from '../../../domain/services/resolver-deposito-divergencia.js';
import { buildUnidadesPorCaixaMap } from '../../../domain/services/unidade-medida.js';
import { buildItensAguardandoArmazenagem } from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import {
  mergeItensAguardandoComDistribuicaoReal,
  type TransferenciaAguardArmazenagem,
} from '../../../domain/services/merge-itens-aguardando-distribuicao.js';
import { MovimentarEstoqueUseCase } from './movimentar-estoque.usecase.js';
import { ReconciliarSaldoRecebimentoUseCase } from './reconciliar-saldo-recebimento.usecase.js';

export type DistribuirSaldoRecebimentoFinalizadoInput = {
  unidadeId: string;
  preRecebimentoId: string;
  itensEsperados: ItemPreRecebimentoRecord[];
  itensConferidos: ItemRecebimentoRecord[];
  divergencias: DivergenciaRecebimentoRecord[];
  avarias: RecebimentoAvariaRecord[];
  operatorId: number | null;
};

export type ItemAguardandoArmazenagem = {
  unitizadorId: string | null;
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
};

export type DistribuirSaldoRecebimentoFinalizadoResult = {
  itensAguardandoArmazenagem: ItemAguardandoArmazenagem[];
};

@Injectable()
export class DistribuirSaldoRecebimentoFinalizadoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    private readonly movimentarEstoqueUseCase: MovimentarEstoqueUseCase,
    private readonly reconciliarSaldoRecebimentoUseCase: ReconciliarSaldoRecebimentoUseCase,
  ) {}

  async execute(
    input: DistribuirSaldoRecebimentoFinalizadoInput,
  ): Promise<DistribuirSaldoRecebimentoFinalizadoResult> {
    const unidadesPorCaixaMap = buildUnidadesPorCaixaMap(input.itensEsperados);

    await this.reconciliarSaldoRecebimentoUseCase.execute({
      unidadeId: input.unidadeId,
      preRecebimentoId: input.preRecebimentoId,
      itensEsperados: input.itensEsperados,
      itensConferidos: input.itensConferidos,
      operatorId: input.operatorId,
    });

    const documentoRef = buildPreRecebimentoDocumentoRef(
      input.preRecebimentoId,
    );
    const depositos = await this.loadDepositos(input.unidadeId);
    const saldosTransf =
      await this.estoqueRepository.getNetSaldoTransfPorDocumento(
        input.unidadeId,
        depositos.TRANSF.id,
        documentoRef,
      );

    const avariaPorProduto = await this.aggregateAvarias(
      input.avarias,
      unidadesPorCaixaMap,
    );
    const divergenciasPorProduto = this.groupDivergencias(input.divergencias);
    const bucketsPorProduto = groupSaldoTransfBucketsByProduto(saldosTransf);
    const transferidoParaAguard: TransferenciaAguardArmazenagem[] = [];

    for (const [produtoId, buckets] of bucketsPorProduto) {
      const totalFisico = sumSaldoTransfBuckets(buckets);

      if (totalFisico <= 0) {
        continue;
      }

      const tiposDivergencia = (
        divergenciasPorProduto.get(produtoId) ?? []
      ).map((item) => item.tipoDivergencia);
      const qtyAvariaTotal = Math.min(
        totalFisico,
        avariaPorProduto.get(produtoId) ?? 0,
      );
      const qtyIntegroTotal = totalFisico - qtyAvariaTotal;
      const destinoCodigo = resolverDepositoDestinoFisico(tiposDivergencia);
      const destino = depositos[destinoCodigo];

      let bucketsRestantes = buckets.map((bucket) => ({ ...bucket }));

      if (qtyAvariaTotal > 0) {
        const avariaDrain = drainSaldoTransfBuckets({
          buckets: bucketsRestantes,
          quantidade: qtyAvariaTotal,
        });
        bucketsRestantes = avariaDrain.buckets;

        for (const drain of avariaDrain.drains) {
          await this.movimentarEstoqueUseCase.transferirDeposito({
            unidadeId: input.unidadeId,
            depositoOrigemId: depositos.TRANSF.id,
            depositoDestinoId: depositos.AVARIA.id,
            produtoId,
            quantidade: drain.quantidade,
            unidadeMedida: 'UN',
            documentoRef,
            motivo: 'recebimento_avaria',
            operatorId: input.operatorId,
            lote: drain.bucket.lote || undefined,
            validade: drain.bucket.validade,
            numeroSerie: drain.bucket.numeroSerie || undefined,
          });
        }
      }

      if (qtyIntegroTotal > 0) {
        const integroDrain = drainSaldoTransfBuckets({
          buckets: bucketsRestantes,
          quantidade: qtyIntegroTotal,
        });

        for (const drain of integroDrain.drains) {
          await this.movimentarEstoqueUseCase.transferirDeposito({
            unidadeId: input.unidadeId,
            depositoOrigemId: depositos.TRANSF.id,
            depositoDestinoId: destino.id,
            produtoId,
            quantidade: drain.quantidade,
            unidadeMedida: 'UN',
            documentoRef,
            motivo:
              destinoCodigo === 'QUARENTENA'
                ? 'recebimento_quarentena'
                : 'recebimento_finalizado',
            operatorId: input.operatorId,
            lote: drain.bucket.lote || undefined,
            validade: drain.bucket.validade,
            numeroSerie: drain.bucket.numeroSerie || undefined,
          });

          if (destinoCodigo === 'AGUARD_ARM') {
            transferidoParaAguard.push({
              produtoId,
              quantidade: drain.quantidade,
              lote: drain.bucket.lote || '',
              numeroSerie: drain.bucket.numeroSerie || '',
            });
          }
        }
      }
    }

    for (const [produtoId, divergencias] of divergenciasPorProduto) {
      const falta = calcularFaltaSemFisico(divergencias);

      if (falta <= 0) {
        continue;
      }

      await this.movimentarEstoqueUseCase.registrarEntrada({
        unidadeId: input.unidadeId,
        depositoId: depositos.DEB_TRANSP.id,
        produtoId,
        quantidade: falta,
        unidadeMedida: 'UN',
        documentoRef,
        motivo: 'recebimento_falta',
        operatorId: input.operatorId,
        natureza: 'debito',
      });
    }

    const itensConferidos = buildItensAguardandoArmazenagem({
      itensConferidos: input.itensConferidos,
      divergenciasPorProduto,
      unidadesPorCaixaMap,
    });

    const itensAguardandoArmazenagem =
      mergeItensAguardandoComDistribuicaoReal(
        itensConferidos,
        transferidoParaAguard,
      );

    return { itensAguardandoArmazenagem };
  }

  private async loadDepositos(unidadeId: string) {
    const codes: DepositoCodigo[] = [
      'TRANSF',
      'AGUARD_ARM',
      'AVARIA',
      'DEB_TRANSP',
      'QUARENTENA',
    ];
    const entries = await Promise.all(
      codes.map(async (codigo) => {
        const deposito = await this.estoqueRepository.findDepositoByCodigo(
          unidadeId,
          codigo,
        );

        if (!deposito) {
          throw new Error(`Depósito ${codigo} não encontrado`);
        }

        return [codigo, deposito] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<
      DepositoCodigo,
      (typeof entries)[number][1]
    >;
  }

  private groupDivergencias(divergencias: DivergenciaRecebimentoRecord[]) {
    const map = new Map<
      string,
      Array<{
        tipoDivergencia: TipoDivergencia;
        quantidadeEsperada: number | null;
        quantidadeRecebida: number | null;
      }>
    >();

    for (const divergencia of divergencias) {
      if (!divergencia.produtoId) {
        continue;
      }

      const current = map.get(divergencia.produtoId) ?? [];
      current.push({
        tipoDivergencia: divergencia.tipoDivergencia,
        quantidadeEsperada: divergencia.quantidadeEsperada,
        quantidadeRecebida: divergencia.quantidadeRecebida,
      });
      map.set(divergencia.produtoId, current);
    }

    return map;
  }

  private async aggregateAvarias(
    avarias: RecebimentoAvariaRecord[],
    unidadesPorCaixaMap: Map<string, number>,
  ) {
    const map = new Map<string, number>();

    for (const avaria of avarias) {
      if (!avaria.produtoId) {
        continue;
      }

      let unidadesPorCaixa = unidadesPorCaixaMap.get(avaria.produtoId) ?? 0;

      if (unidadesPorCaixa <= 0) {
        const produto = await this.produtoRepository.findById(avaria.produtoId);
        unidadesPorCaixa = produto?.unidadesPorCaixa ?? 1;
      }

      const total =
        avaria.quantidadeUnidades +
        avaria.quantidadeCaixas * unidadesPorCaixa;

      map.set(
        avaria.produtoId,
        (map.get(avaria.produtoId) ?? 0) + total,
      );
    }

    return map;
  }
}
