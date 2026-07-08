import { Inject, Injectable, Logger } from '@nestjs/common';

import { buildRecebimentoSaldoDocumentoRef } from '../../../domain/model/estoque/deposito.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';
import type {
  LinhaSaldoRecebimentoJobData,
  ProcessarSaldoRecebimentoJobData,
} from '../../../infra/queues/recebimento.queue.js';

function resolveClassificacaoDocumento(
  linha: LinhaSaldoRecebimentoJobData,
): 'liberado' | 'bloqueado_sobra' | 'bloqueado_nao_esperado' | 'bloqueado_avaria' {
  if (linha.status === 'liberado') {
    return 'liberado';
  }

  if (linha.tipoAnomalia === 'produto_nao_esperado') {
    return 'bloqueado_nao_esperado';
  }

  if (linha.tipoAnomalia === 'avaria') {
    return 'bloqueado_avaria';
  }

  return 'bloqueado_sobra';
}

function resolveMotivoBloqueioCodigo(
  linha: LinhaSaldoRecebimentoJobData,
): string | null {
  if (linha.status !== 'bloqueado') {
    return null;
  }

  if (linha.tipoAnomalia === 'produto_nao_esperado') {
    return 'RECEBIMENTO_PRODUTO_NAO_ESPERADO';
  }

  if (linha.tipoAnomalia === 'avaria') {
    return 'RECEBIMENTO_AVARIA';
  }

  return 'RECEBIMENTO_SOBRA';
}

@Injectable()
export class ProcessarSaldoRecebimentoUseCase {
  private readonly logger = new Logger(ProcessarSaldoRecebimentoUseCase.name);

  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  async execute(data: ProcessarSaldoRecebimentoJobData): Promise<void> {
    await this.motivoBloqueioSaldoRepository.ensureMotivosSistemaUnidade(
      data.unidadeId,
    );

    const deposito = await this.estoqueRepository.findDepositoByCodigo(
      data.unidadeId,
      'TRANSF',
    );

    if (!deposito) {
      throw new Error(
        `Depósito TRANSF não encontrado para unidade "${data.unidadeId}"`,
      );
    }

    const enderecoVirtual =
      await this.estoqueRepository.ensureEnderecoVirtualDeposito({
        unidadeId: data.unidadeId,
        depositoCodigo: deposito.codigo,
      });

    for (const linha of data.linhas) {
      const classificacao = resolveClassificacaoDocumento(linha);
      const documentoRef = buildRecebimentoSaldoDocumentoRef(data.recebimentoId, {
        produtoId: linha.produtoId,
        lote: linha.lote,
        numeroSerie: linha.numeroSerie,
        classificacao,
      });

      const alreadyProcessed =
        await this.estoqueRepository.existsMovimentacaoByDocumentoRef(
          documentoRef,
        );

      if (alreadyProcessed) {
        this.logger.log(
          `Linha ${classificacao} do produto ${linha.produtoId} já processada (documentoRef=${documentoRef})`,
        );
        continue;
      }

      let motivoBloqueioId: string | null = null;
      const motivoCodigo = resolveMotivoBloqueioCodigo(linha);

      if (motivoCodigo) {
        const motivo = await this.motivoBloqueioSaldoRepository.findByCodigo(
          data.unidadeId,
          motivoCodigo,
        );

        if (!motivo) {
          throw new Error(
            `Motivo de bloqueio "${motivoCodigo}" não encontrado para unidade "${data.unidadeId}"`,
          );
        }

        motivoBloqueioId = motivo.id;
      }

      await this.estoqueRepository.upsertSaldoEndereco({
        unidadeId: data.unidadeId,
        produtoId: linha.produtoId,
        depositoId: deposito.id,
        enderecoId: enderecoVirtual.id,
        lote: linha.lote,
        validade: linha.validade ? new Date(linha.validade) : null,
        numeroSerie: linha.numeroSerie,
        status: linha.status,
        motivoBloqueioId,
        bloqueadoPor: data.userId,
        quantidadeDelta: linha.quantidade,
        unidadeMedida: linha.unidadeMedida,
      });

      await this.estoqueRepository.registrarMovimentacaoEstoque({
        unidadeId: data.unidadeId,
        produtoId: linha.produtoId,
        depositoDestinoId: deposito.id,
        enderecoDestinoId: enderecoVirtual.id,
        tipoMovimento: 'ENTRADA',
        quantidade: linha.quantidade,
        unidadeMedida: linha.unidadeMedida,
        lote: linha.lote,
        validade: linha.validade ? new Date(linha.validade) : null,
        numeroSerie: linha.numeroSerie,
        documentoRef,
        motivo: 'recebimento_finalizado',
        operatorId: data.userId,
      });
    }
  }
}
