import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ProcessarSaldoTarefaJobData } from '../../../infra/queues/armazenagem.queue.js';
import {
  buildArmazenagemTarefaItemSaldoDocumentoRef,
  processarTransferenciaSaldoArmazenagem,
} from '../../services/armazenagem/processar-transferencia-saldo-armazenagem.js';

@Injectable()
export class ProcessarSaldoTarefaArmazenagemUseCase {
  private readonly logger = new Logger(ProcessarSaldoTarefaArmazenagemUseCase.name);

  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(data: ProcessarSaldoTarefaJobData): Promise<void> {
    const tarefa = await this.armazenagemRepository.findTarefaById(data.tarefaId);

    if (!tarefa) {
      throw new NotFoundException(`Tarefa "${data.tarefaId}" não encontrada`);
    }

    if (tarefa.status !== 'armazenada') {
      throw new Error(
        `Tarefa "${data.tarefaId}" não está armazenada (status=${tarefa.status})`,
      );
    }

    const enderecoConfirmadoId =
      tarefa.enderecoConfirmadoId ?? data.enderecoConfirmadoId;

    if (!enderecoConfirmadoId) {
      throw new Error(`Tarefa "${data.tarefaId}" sem endereço confirmado`);
    }

    for (const item of tarefa.itens) {
      if (item.status !== 'armazenado') {
        throw new Error(
          `Item "${item.id}" da tarefa "${data.tarefaId}" não está armazenado`,
        );
      }

      const documentoRef = buildArmazenagemTarefaItemSaldoDocumentoRef(
        data.tarefaId,
        item.id,
      );

      await processarTransferenciaSaldoArmazenagem(this.estoqueRepository, {
        unidadeId: data.unidadeId,
        item,
        enderecoConfirmadoId,
        operatorId: data.operatorId,
        documentoRef,
      });

      this.logger.log(
        `Saldo do item ${item.id} (tarefa ${data.tarefaId}) transferido de TRANSF para GERAL (documentoRef=${documentoRef})`,
      );
    }
  }
}
