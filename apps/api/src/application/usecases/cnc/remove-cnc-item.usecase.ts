import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CNC_EVENTO } from '../../../domain/model/cnc/cnc.model.js';
import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

export type RemoveCncItemUseCaseInput = {
  cncId: string;
  itemId: string;
  userId: number;
};

@Injectable()
export class RemoveCncItemUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: RemoveCncItemUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Itens só podem ser removidos em CNCs em análise',
      );
    }

    if (cnc.itens.length <= 1) {
      throw new BadRequestException(
        'Não é possível remover o último item da CNC',
      );
    }

    const existing = cnc.itens.find((item) => item.id === input.itemId);

    if (!existing) {
      throw new NotFoundException(
        `Item "${input.itemId}" não encontrado na CNC`,
      );
    }

    const removed = await this.cncRepository.removeItem(
      input.cncId,
      input.itemId,
    );

    if (!removed) {
      throw new NotFoundException(
        `Item "${input.itemId}" não encontrado na CNC`,
      );
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.ITEM_REMOVIDO,
      descricao: `Item ${existing.sku ?? existing.descricaoProduto ?? input.itemId} removido`,
      metadata: {
        itemId: input.itemId,
        itemSnapshot: {
          tipo: existing.tipo,
          subtipoOcorrencia: existing.subtipoOcorrencia,
          sku: existing.sku,
          descricaoProduto: existing.descricaoProduto,
          unidadeMedida: existing.unidadeMedida,
          quantidadeEsperada: existing.quantidadeEsperada,
          quantidadeRecebida: existing.quantidadeRecebida,
          quantidadeDivergente: existing.quantidadeDivergente,
          pesoEsperado: existing.pesoEsperado,
          pesoRecebido: existing.pesoRecebido,
        },
      },
      criadoPorUserId: input.userId,
    });

    return removed;
  }
}
