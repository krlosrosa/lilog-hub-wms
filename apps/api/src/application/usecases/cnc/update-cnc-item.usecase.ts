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
  type UpdateCncItemInput,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';

export type UpdateCncItemUseCaseInput = {
  cncId: string;
  itemId: string;
  userId: number;
  data: UpdateCncItemInput;
};

function buildItemSnapshot(item: {
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  quantidadeDivergente: number | null;
  pesoEsperado: number | null;
  pesoRecebido: number | null;
}) {
  return {
    quantidadeEsperada: item.quantidadeEsperada,
    quantidadeRecebida: item.quantidadeRecebida,
    quantidadeDivergente: item.quantidadeDivergente,
    pesoEsperado: item.pesoEsperado,
    pesoRecebido: item.pesoRecebido,
  };
}

@Injectable()
export class UpdateCncItemUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute(input: UpdateCncItemUseCaseInput) {
    const cnc = await this.cncRepository.findById(input.cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${input.cncId}" não encontrada`);
    }

    if (cnc.situacao !== 'em_analise') {
      throw new BadRequestException(
        'Itens só podem ser editados em CNCs em análise',
      );
    }

    const existing = cnc.itens.find((item) => item.id === input.itemId);

    if (!existing) {
      throw new NotFoundException(
        `Item "${input.itemId}" não encontrado na CNC`,
      );
    }

    const updateData: UpdateCncItemInput = { ...input.data };

    if (existing.subtipoOcorrencia === 'peso_divergente') {
      if (
        updateData.pesoEsperado !== undefined &&
        updateData.pesoRecebido !== undefined
      ) {
        const esperado = updateData.pesoEsperado ?? 0;
        const recebido = updateData.pesoRecebido ?? 0;
        updateData.quantidadeDivergente = Math.abs(esperado - recebido);
      }
    } else if (
      updateData.quantidadeEsperada !== undefined &&
      updateData.quantidadeRecebida !== undefined
    ) {
      const esperada = updateData.quantidadeEsperada ?? 0;
      const recebida = updateData.quantidadeRecebida ?? 0;
      updateData.quantidadeDivergente = Math.abs(esperada - recebida);
    }

    const updated = await this.cncRepository.updateItem(
      input.cncId,
      input.itemId,
      updateData,
    );

    if (!updated) {
      throw new NotFoundException(
        `Item "${input.itemId}" não encontrado na CNC`,
      );
    }

    await this.cncEventPublisher.publishRegistrarEvento({
      cncId: input.cncId,
      tipoEvento: CNC_EVENTO.ITEM_ATUALIZADO,
      descricao: `Item ${existing.sku ?? existing.descricaoProduto ?? input.itemId} atualizado`,
      metadata: {
        itemId: input.itemId,
        subtipoOcorrencia: existing.subtipoOcorrencia,
        unidadeMedida: existing.unidadeMedida,
        before: buildItemSnapshot(existing),
        after: buildItemSnapshot(updated),
      },
      criadoPorUserId: input.userId,
    });

    return updated;
  }
}
