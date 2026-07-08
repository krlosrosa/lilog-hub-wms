import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ProcessarSaldoItemJobData } from '../../../infra/queues/armazenagem.queue.js';
import {
  buildArmazenagemItemSaldoDocumentoRef,
  processarTransferenciaSaldoArmazenagem,
} from '../../services/armazenagem/processar-transferencia-saldo-armazenagem.js';

@Injectable()
export class ProcessarSaldoItemArmazenagemUseCase {
  private readonly logger = new Logger(ProcessarSaldoItemArmazenagemUseCase.name);

  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(data: ProcessarSaldoItemJobData): Promise<void> {
    const item = await this.armazenagemRepository.findItemById(data.itemId);

    if (!item) {
      throw new NotFoundException(`Item "${data.itemId}" não encontrado`);
    }

    if (item.status !== 'armazenado') {
      throw new Error(
        `Item "${data.itemId}" não está armazenado (status=${item.status})`,
      );
    }

    const enderecoConfirmadoId =
      item.enderecoConfirmadoId ?? data.enderecoConfirmadoId;

    if (!enderecoConfirmadoId) {
      throw new Error(`Item "${data.itemId}" sem endereço confirmado`);
    }

    const documentoRef = buildArmazenagemItemSaldoDocumentoRef(data.itemId);

    await processarTransferenciaSaldoArmazenagem(this.estoqueRepository, {
      unidadeId: data.unidadeId,
      item,
      enderecoConfirmadoId,
      operatorId: data.operatorId,
      documentoRef,
    });

    this.logger.log(
      `Saldo do item ${data.itemId} transferido de TRANSF para GERAL (documentoRef=${documentoRef})`,
    );
  }
}
